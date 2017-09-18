'use strict'; // eslint-disable-line

import 'babel-polyfill';
import '../common/devFallback';
import '../common/unhandledRejection';

import bodyParser from 'body-parser';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import fs from 'fs';
import path from 'path';
import createHistory from 'history/createMemoryHistory';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import {promisify} from 'util';

import {
  Environment,
  Network,
  RecordSource,
  Store,
  fetchQuery,
} from 'relay-runtime';

import App from '../client/components/App';
import DocumentTitle from '../client/components/DocumentTitle';
import HTTPError from '../client/components/HTTPError';
import NotFoundError from '../common/NotFoundError';
import RedirectError from '../common/RedirectError';
import RenderTextError from '../common/RenderTextError';
import getRequestBody from '../common/getRequestBody';
import routeConfig from '../common/routeConfig';
import createRouter from '../common/createRouter';
import QueryCache from './QueryCache';
import gatherPaths from './gatherPaths';
import getAssetURL from './getAssetURL';
import getLoaders from './getLoaders';
import getCanonicalURLForRequest from './getCanonicalURLForRequest';
import feed from './actions/feed';
import schema from './schema';
import renderCompiledPug from './renderCompiledPug';
import runQuery from './runQuery';

const APP_PORT = 3000;

const app = express();

const queryCache = new QueryCache();

const readFile = util.promisify(fs.readFile);

app.disable('x-powered-by');

app.set('views', path.join(__dirname, 'views'));
if (__DEV__) {
  app.set('view engine', 'pug');
} else {
  app.set('view engine', 'js');
  app.engine('js', renderCompiledPug);
}

let styles = null;
const getStyles = async function() {
  if (!styles && !__DEV__) {
    // Expect to be running out of dist.
    const css = path.join(
      __dirname,
      '../../public/static',
      require('../webpack-assets').main.css,
    );
    styles = await readFile(css);
  }
  return styles;
};

function jadeHandler(resource, extraLocals = {}) {
  return async (request, response) => {
    const canonical = await getCanonicalURLForRequest(request);
    const styles = await getStyles();
    // TODO: if canonical is non-null and doesn't match actual, 301 redirect
    const locals = {
      bundle: getAssetURL(
        '/static/' +
          (__DEV__ ? 'bundle.js' : require('../webpack-assets').main.js),
      ),
      styles,
      canonical,
      production: !__DEV__,
      ...extraLocals,
    };
    response.render(resource, locals);
  };
}

// "/", "/blog", "/blog/*" etc.
const appRoutes = gatherPaths(routeConfig);

// Additional config for specific routes.
const extraLocals = {
  '/': {
    home: '/blog.rss',
  },
  '/blog': {
    alternate: '/blog.rss',
  },
  '/blog/*': {
    home: '/blog.rss',
  },
};

appRoutes.forEach(route => {
  app.get(route, async (request, response) => {
    const history = createHistory({
      initialEntries: [request.originalUrl],
      initialIndex: 0,
    });
    const router = createRouter(history);
    const cache = {};
    const environment = new Environment({
      network: Network.create((operation, variables) => {
        const query = queryCache.getQuery(operation.id);
        return runQuery(query, variables)
          .then(result => {
            const key = getRequestBody(operation, variables);
            cache[key] = result;
            return result;
          })
          .catch(error => console.log('got an error', error));
        // TODO: really handle errors
      }),
      store: new Store(new RecordSource()),
    });
    const api = {
      environment,
      fetchQuery: fetchQuery.bind(null, environment),
    };

    function resolve(location) {
      return router
        .resolve({
          api,
          path: location.pathname,
        })
        .then(({component, description}) => {
          return {
            description,
            pageContent: ReactDOMServer.renderToStaticMarkup(
              <App router={router}>
                {component}
              </App>,
            ),
          };
        })
        .catch(error => {
          if (error instanceof RedirectError) {
            response.redirect(error.code, error.target);
            return null;
          } else if (error instanceof RenderTextError) {
            response.set('Content-Type', error.type);
            response.send(error.text);
            return null;
          }
          const code = error instanceof NotFoundError ? 404 : 500;
          response.status(code);
          return {
            pageContent: ReactDOMServer.renderToStaticMarkup(
              <App router={router}>
                <HTTPError code={code} />
              </App>,
            ),
          };
        });
    }
    const resolved = await resolve(history.location);
    const title = DocumentTitle.peek();
    DocumentTitle.rewind();
    if (resolved) {
      // May be null if we had a redirect.
      const {description, pageContent} = resolved;
      const locals = {
        cache: JSON.stringify(cache),
        description,
        pageContent,
        title,
        ...extraLocals[route],
      };
      return jadeHandler('index', locals)(request, response);
    }
  });
});

app.use(bodyParser.json());
app.use('/graphql', (request, response, next) => {
  // Totally hacked in persisted-query support:
  let query;
  if (request.body && request.body.id) {
    query = queryCache.getQuery(request.body.id);
    request.body.query = query;
  }
  if (!__DEV__ && !query) {
    // In prod, we only accept persisted queries (to prevent abuse).
    response.status(400).send('Bad Request');
    return;
  }
  const options = {
    rootValue: {
      loaders: getLoaders(),
    },
    // TODO: something like this in __DEV__
    // errorFormat: error => ({
    //   message: error.message,
    //   locations: error.locations,
    //   stack: error.stack,
    // }),
    graphiql: __DEV__,
    schema,
  };
  return graphqlHTTP(request => options)(request, response, next);
});

app.get('/blog.rss', async (request, response) => {
  const feedContent = await feed();
  response.set('Content-Type', 'application/rss+xml');
  response.send(feedContent);
});

if (__DEV__) {
  const httpProxy = require('http-proxy');
  const WebpackDevServer = require('webpack-dev-server');
  const webpack = require('webpack');
  const webpackConfig = require('../../webpack.config');

  const proxy = httpProxy.createProxyServer();
  const compiler = webpack(webpackConfig);
  let bundleStart = null;
  compiler.plugin('compile', () => {
    console.log('Starting bundle...');
    bundleStart = Date.now();
  });
  compiler.plugin('done', () => {
    console.log('Bundle finished in ' + (Date.now() - bundleStart) + 'ms.');
  });
  const bundler = new WebpackDevServer(compiler, {
    publicPath: '/static/',
    hot: true,
    noInfo: true,
  });
  bundler.listen(APP_PORT + 1, 'localhost', () => {
    console.log(
      'Webpack dev server listening at http://localhost:%s',
      APP_PORT + 1,
    );
  });
  app.all('/static/*', (request, response) => {
    return proxy.web(request, response, {
      target: 'http://localhost:' + (APP_PORT + 1) + '/static',
      prependPath: false,
    });
  });

  proxy.on('error', error => console.log('Proxy error: %s', error));
}

app.get('/heartbeat', (request, response) => {
  response.send('༼ つ ◕_◕ ༽つ');
});

// In production, nginx should handle this, but in case it doesn't:
app.use(
  express.static(path.join(__dirname, '..', '..', 'public'), {
    extensions: ['html'], // Given foobar, try for foobar.html
    redirect: false, // Prevent redirect from issues to issues/
  }),
);

function errorPage(error, message, request, response) {
  return {
    html: () => {
      const history = createHistory({
        initialEntries: [request.originalUrl],
        initialIndex: 0,
      });
      const router = createRouter(history);
      const pageContent = ReactDOMServer.renderToStaticMarkup(
        <App router={router}>
          <HTTPError code={error} />
        </App>,
      );

      jadeHandler('error', {error, message, pageContent})(request, response);
    },
    json: () => response.send({error, message}),
    text: () => response.send(`${error} ${message}`),
  };
}

app.use((request, response, next) => {
  response.status(404);
  response.format(errorPage(404, 'Not Found', request, response));
});

app.use((error, request, response, next) => {
  response.status(500);
  response.format(errorPage(500, 'Internal Server Error', request, response));
});

const server = app.listen(APP_PORT, () => {
  console.log('Listening at http://localhost:%s', APP_PORT);
});
