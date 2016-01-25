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
  if(display_guide_toggles()){
    guide_pagination();
    if($(document).attr('location').hash != ""){
      display_page_by_name(
        $(document).attr('location').hash.split('#')[1]
      )
    } else {
      guide_provider_show();
    }
    $('a').click(function(){
      path = $(this).attr('href');
      if(path.includes('#')){
        parts = path.split('#');
        if(parts[0] == $(document).attr('location').pathname){
          display_page_by_name(parts[1]);
        }
      }
    });
  }
});


function guide_provider_show(name){
  if(!name){
    name = 'aws';
  }
  items = $('h4[id*="-sparkles-"]');
  if(items.size() > 0){
    to_show = items.filter('[id*="-sparkles-'+ name + '"]');
    to_hide = items.filter(':not([id*="-sparkles-'+ name + '"])');
    to_show.each(function(){
      $(this).removeClass('provider-invisible');
      $(this).addClass('provider-invisible');
      $(this).next().removeClass('provider-invisible');
    });
    to_hide.each(function(){
      $(this).addClass('provider-invisible');
      $(this).next().addClass('provider-invisible');
    });
    $('[id^="provider-"]').removeClass('btn-primary');
    $('#provider-' + name).addClass('btn-primary');
    reload_current_page();
    return true;
  }
}

function display_guide_toggles(){
  items = $('h4[id*="-sparkles-"]');
  if(items.size() > 1){
    valid_names = items.map(function(){
      parts = $(this).attr('id').split('-');
      return parts[parts.indexOf('sparkles') + 1];
    }).toArray().filter(function(v){ return !!v; });
    var names = [];
    $(valid_names).each(function(k,v){
      if(names.indexOf(v) == -1){
        names.push(v);
      }
    });
    names = $(names.sort()).map(function(k,v){
      return v[0].toUpperCase() + v.slice(1);
    });
    console.log(names);
    container = $('.documentation-content').first();
    result = names.map(function(idx, value){
      l_value = value.toLowerCase();
      return '<button id="provider-' + l_value + '" class="btn" onclick="guide_provider_show(\'' + l_value + '\');">' + value + '</button>';
    }).toArray().join(' ');
    container.prepend('<div class="pull-right anchor">' + result + '</div>');
    return true;
  }
}

function guide_pagination(){
  window.sparkle_guide_pagination = {
    'current_page': 0,
    'total_pages': $('h2').size()
  };
  $('h2').first().nextAll().hide();
}

function display_page(idx){
  max_pg = window.sparkle_guide_pagination['total_pages'] - 1;
  n_pg = idx + 1;
  p_pg = idx - 1;
  if(idx > max_pg){
    alert('ACK: Page is out of bounds!');
  } else {
    pages = $('h2');
    pages.hide();
    $('h2').first().nextAll().hide();
    start_at = $(pages[idx]);
    $('.page-controls').detach();
    controls = '<div class="col-md-6">';
    if(p_pg < 0){
      controls = controls + '<button class="button button-full-width disabled" disabled="disabled">Previous</button> '
    } else {
      controls = controls + '<button class="button button-full-width" onclick="display_page(' + p_pg + ');">Previous</button> '
    }
    controls = controls + '</div><div class="col-md-6">';
    if(n_pg > max_pg){
      controls = '<button class="button button-full-width disabled" disabled="disabled">Next</button>'
    } else {
      controls = controls + '<button class="button button-full-width" onclick="display_page(' + n_pg + ');">Next</button> '
    }
    controls = controls + '</div>';
    $(pages[idx + 1]).before('<div class="page-controls anchor" style="display: block; text-align: center;"><div class="row">' + controls + '</div></div>');
    start_at.show();
    start_at.nextUntil('h2').show();
    window.sparkle_guide_pagination['current_page'] = idx;
    $(document).attr('location').hash = start_at.attr('id')
    $('html, body').animate({
      scrollTop: start_at.offset().top
    }, 200);
    return true;
  }
}

function reload_current_page(){
  if(window.sparkle_guide_pagination){
    display_page(window.sparkle_guide_pagination['current_page']);
  }
}

function display_page_by_name(name){
  page = $('h2[id="' + name + '"]').first();
  idx = $('h2').index(page);
  display_page(idx);
}
