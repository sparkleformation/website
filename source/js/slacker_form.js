slacker_form = function(slacker_form_id) {
  $(slacker_form_id).submit( function() {
    slack_webhook = $("#slacker-webhook").val();
    slack_channel = $("#slacker-channel").val();
    if ( slack_channel.startsWith("#") != true ) {
      slack_channel = "#" + slack_channel
    };
    slack_username = $("#slacker-username").val();
    slack_icon = $("#slacker-icon").val();
    redirect = $("#slacker-redirect").val();
    name = $("input#name").val();
    organization = $("input#organization").val();
    email = $("input#email").val();
    phone = $("input#phone").val();
    message = $("textarea#message").val();

    $(slacker_form_id).addClass('disabled');
    $('.form-control').attr('disabled', true);
    $('#submit').addClass('disabled');
    $('#submit').attr('value', 'Sending...');

    pretext = "New form submitted from " + window.location.href + ":";

    payload = {
      "pretext": pretext,
      "fields": [],
      "username": slack_username,
      "channel": slack_channel,
      "icon_url": slack_icon
    };

    form_content = $(slacker_form_id).children();
    for (var i = 0; i < form_content.length; i++) {
      var form_element = form_content[i];

      if (form_element.hasAttribute('class')) {
        if (form_element.classList.contains('form-group')) {
          var form_label = form_element.getElementsByTagName('label')[0];
          var form_data = form_element.getElementsByClassName('form-control')[0];
          if (form_data.tagName == "TEXTAREA") {
            var short_field = false;
          } else {
            var short_field = true;
          };
          field_data = {
            "title": $(form_label).html(),
            "value": $(form_data).val(),
            "short": short_field
          };
          payload["fields"].push(field_data);
          // debug = 'DEBUG: adding field "' + $(form_label).html() + '": "' + $(form_data).val() + '".';
          // console.log(debug);
        };
      };
    };

    // debug = 'DEBUG: Attempting to post the following payload to ' + slack_webhook + ' as "' + slack_username + '":'
    // console.log(debug);
    // console.log(JSON.stringify(payload));

    $.ajax({
      url: slack_webhook,
      type: "POST",
      data: JSON.stringify(payload),
      dataType: "json",
      complete: function(result, status){
        if(result.status == 200){
          $('#submit').addClass('success');
          $('#submit').attr('value', 'Sent!');
          setTimeout(function(){ window.document.location = redirect; }, 5000);
        } else {
          $('#submit').addClass('failed');
          $('#submit').attr('value', 'Failed!');
          // if ( slack_channel.startsWith("#") != true ) {
          //   error = "ERROR: " + result.status + " error may be a result of an improperly configured channel name (" + slack_channel + "); channel names should start with a '#'.";
          //   console.log(error);
          // };
          setTimeout(function(){ window.document.location = window.location.href; }, 5000);
        }
      }
    });

    return false;
  });
};

$(document).ready(slacker_form( $('#slacker-form').val() ));
$(document).on('page:load', slacker_form);
