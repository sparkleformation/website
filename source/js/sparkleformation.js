$(document).ready(function() {
  var headers = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
  for (i in headers) {
    var tag = headers[i];
    $(tag).addClass('anchor');
    $(tag).prev().addClass('anchor-offset');
  };

  $('.coming-soon a').click(false);
  $('.coming-soon a').html("Coming soon >");

  $('#sfn-demo code').focus()
  .typetype( $('#demo-1-input').val(), {e:0});
  stdOut( '#demo-1-prompts', '#sfn-demo code', 5000,  500);
  stdOut( '#demo-1-events',  '#sfn-demo code', 10000,  2500 );
  stdOut( '#demo-1-output',  '#sfn-demo code', 18000, 0 );
});

function stdOut (output, target, start, interval) {
  var delay = start;
  var line = 0;
  var lines = ( $(output).val().split("\n").length );
  for (count = 0; count < lines; count++) {
    setTimeout(function(){
      $(target).append( "\n" + $(output).val().split("\n")[line] );
      line += 1;
    }, delay);
    delay += interval;
  };
};
