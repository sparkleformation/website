# What is this?

A simple landing page for **SparkleFormation** made with [Middleman][middleman] and
[Bootstrap][bootstrap], written in [Yaml][yaml], [Haml][haml], [Sass][sass], and
plain ol' Javascript.

# How does it work?

1. Clone the repo

  ```
  git clone git@github.com:sparkleformation/website.git
  ```

2. Bundle

  ```
  bundle install
  ```

3. Start Middleman

  ```
  bundle exec middleman
  ```

# How do I deploy?

You can deploy the SparkleFormation landing page website to GitHub Pages using the
[middleman-deploy][middleman-deploy] gem:

```
bundle exec middleman build && bundle exec middleman deploy
```


[middleman]:        http://middlemanapp.com
[bootstrap]:        http://www.getbootstrap.com
[yaml]:             http://yaml.org/
[haml]:             http://haml.info/
[sass]:             http://sass-lang.com/
[middleman-deploy]: https://github.com/middleman-contrib/middleman-deploy
