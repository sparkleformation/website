set :css_dir, 'css'
set :js_dir, 'js'
set :images_dir, 'img'
set :markdown_engine, :kramdown
set :markdown, :fenced_code_blocks => true, :smartypants => true, :autolink => true,
    :quote => true, :footnotes => true
set :layouts_dir, 'layouts'
set :layout, 'layout'
set :partials_dir, 'partials'
set :trailing_slash, true

activate :directory_indexes
page "/docs/*/*", :directory_index => false

with_layout :docs do
  page "/docs"
  page "/docs/*"
end

configure :build do
  ignore 'css/octicons/LICENSE.txt'
  ignore 'css/octicons/README.md'
end

activate :livereload
activate :syntax

activate :deploy do |deploy|
  deploy.method = :git
  deploy.branch = 'gh-pages'
end
