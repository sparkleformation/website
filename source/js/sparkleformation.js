$(document).ready(function() {
  var headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  for (i in headers) {
    var tag = headers[i];
    $(tag).addClass('anchor');
    $(tag).prev().addClass('anchor-offset');
  };

  $('.coming-soon a').click(false);
  $('.coming-soon a').html("Coming soon >");

  $('.documentation-content table').addClass('table table-hover table-condensed table-responsive')
});
