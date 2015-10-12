import React from 'react';
import Relay from 'react-relay';
import Article from './Article';

class Articles extends React.Component {
  _handleSeeMore = event => {
    event.preventDefault();
    this.props.relay.setVariables({
      count: this.props.relay.variables.count + 10,
    });
  }

  render() {
    return (
      <div>
        <h1>Wiki</h1>
        {
          this.props.viewer.articles.edges.map(({node}) => (
            <Article key={node.id} article={node} />
          ))
        }
        {
          this.props.viewer.articles.pageInfo.hasNextPage ?
            <a href="#more" onClick={this._handleSeeMore}>Load more&hellip;</a> :
            null
        }
      </div>
    );
  }
}

export default Relay.createContainer(Articles, {
  initialVariables: {
    count: 3,
  },
  fragments: {
    viewer: () => Relay.QL`
      fragment on User {
        articles(first: $count) {
          edges {
            node {
              id
              ${Article.getFragment('article')}
            }
          }
          pageInfo {
            hasNextPage
          }
        }
      }
    `,
  },
});