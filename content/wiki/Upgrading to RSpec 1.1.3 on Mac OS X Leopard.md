---
tags: leopard rspec updates
cache_breaker: 1
---

Notes made while upgrading from [RSpec 1.1.2](/wiki/RSpec_1.1.2) to [RSpec 1.1.3](/wiki/RSpec_1.1.3) on [Mac OS X](/wiki/Mac_OS_X) [Leopard](/wiki/Leopard) 10.5.1.

# Installation

    $ sudo gem install rspec
    Password:
    Updating metadata for 33 gems from http://gems.rubyforge.org
    .................................
    complete
    Successfully installed rspec-1.1.2
    1 gem installed
    Installing ri documentation for rspec-1.1.2...
    Installing RDoc documentation for rspec-1.1.2...

Oops! The RubyForge mirrors don't seem to be fully updated yet, let's try again:

    $ sudo gem install rspec
    Password:
    Updating metadata for 33 gems from http://gems.rubyforge.org
    .................................
    complete
    Successfully installed rspec-1.1.3
    1 gem installed
    Installing ri documentation for rspec-1.1.3...
    Installing RDoc documentation for rspec-1.1.3...

# Updating the [FastRI](/wiki/FastRI) index

    $ fastri-server -b
    Building index.
    Indexed:
    * 7733 methods
    * 1368 classes/modules
    Needed 0.572762 seconds

# Updating the [TextMate](/wiki/TextMate) bundle

    $ cd ~/Library/Application\ Support/TextMate/Bundles/RSpec.tmbundle
    $ svn up
    U    Support/lib/spec/mate/runner.rb
    U    Support/lib/spec/mate.rb
    U    Support/spec/spec/mate/runner_spec.rb
    U    Support/spec/spec_helper.rb
    Updated to revision 3281.

# Updating an existing [Rails](/wiki/Rails) application

Seeing as I am managing the application using [Git](/wiki/Git) I do the following:

    $ cd path_to_rails_application_root
    $ git rm -r vendor/plugins/rspec
    $ git rm -r vendor/plugins/rspec_on_rails
    $ script/plugin install svn://rubyforge.org/var/svn/rspec/tags/CURRENT/rspec
    $ script/plugin install --force svn://rubyforge.org/var/svn/rspec/tags/CURRENT/rspec_on_rails
    $ git add vendor/plugins/rspec
    $ git add vendor/plugins/rspec_on_rails
    $ script/generate rspec