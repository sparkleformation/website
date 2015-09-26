set :css_dir, 'css'
set :js_dir, 'js'
set :images_dir, 'img'
set :markdown_engine, :kramdown
set :markdown, :fenced_code_blocks => true, :smartypants => true, :autolink => true,
    :quote => true, :footnotes => true

with_layout :docs do
  page "/docs"
  page "/docs/*"
end

configure :build do
  ignore 'css/octicons/LICENSE.txt'
  ignore 'css/octicons/README.md'
end

activate :livereload
activate :directory_indexes
activate :syntax
activate :deploy do |deploy|
  deploy.method = :git
  deploy.branch = 'gh-pages'
end
