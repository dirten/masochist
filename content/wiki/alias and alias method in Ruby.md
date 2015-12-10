---
tags: ruby
---

```ruby
# keyword, lexically scoped
# arguments are bare identifiers, with no comma between them
alias new_method existing_method

# method defined in the Module class
# takes symbol or string arguments
alias_method :new_method, :existing_method
alias_method 'new_method', 'existing_method'
```

A note about the lexical scoping of the `alias` keyword: the value of `self` is determined at parse time, based on the class context in which the keyword appears. Conversely, `alias_method` is just a method, so it applies to whatever `self` happens to be at runtime:

```ruby
class Foo
  def hello
    puts "Hello from Foo"
  end

  def self.add_alias
    alias hello2 hello
    alias_method :hello3, :hello
  end
end

Foo.add_alias
Foo.new.hello  # => puts "Hello from Foo"
Foo.new.hello2 # => puts "Hello from Foo"
Foo.new.hello3 # => puts "Hello from Foo"

class Bar < Foo
  def hello
    puts "Hello from Bar"
  end
end

Bar.add_alias
Bar.new.hello  # => puts "Hello from Bar"
Bar.new.hello2 # => puts "Hello from Foo"
Bar.new.hello3 # => puts "Hello from Bar"
```

# Source

-   <http://blog.bigbinary.com/2012/01/08/alias-vs-alias-method.html>
