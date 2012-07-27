---
tags: haml updates
cache_breaker: 1
---

Updating the [gem](/wiki/gem) itself is easy:

    sudo gem install haml --no-ri

This is how I updated an existing [Rails](/wiki/Rails) application which had an existing copy of an older version of [Haml](/wiki/Haml) "frozen" into the `vendor/plugins` directory:

    # blow away old gem
    git rm -r vendor/plugins/haml

    # clone the official repo (seeing as we can't just "svn export" anymore)
    git clone git://github.com/nex3/haml.git vendor/plugins/haml

    # make sure we have the right commit checked out
    (cd vendor/plugins/haml && git co 2.0.0)

    # blow away unwanted metadata
    rm -rf vendor/plugins/haml/.git

    # take a snapshot
    git add vendor/plugins/haml

For info on setting up aliases like `git co` see "[Git quickstart](/wiki/Git_quickstart)".