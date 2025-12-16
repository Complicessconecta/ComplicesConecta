(function($){
  $(window).load(function(){
    $('.wrapper').fadeIn();
  });
  var ctrl = $('.controls'),
      t = $('.total', ctrl).attr('data-total'),
      c = $('.current', ctrl),
      n = c.attr('data-current');
  
  $('.next', ctrl).on('click', function(e){
    e.preventDefault();
    ctrl.removeClass('noPrev');
    (n + 1 >= t) ? ( n = t,ctrl.addClass('morph') ) : n++;
    c.attr('data-current', n).html(n);
  });
  
  $('.prev', ctrl).on('click', function(e){
    e.preventDefault();
    ctrl.removeClass('morph');
    (n - 1 <= 1) ? (n = 1, ctrl.addClass('noPrev') ) : n-- ;
    c.attr('data-current', n).html(n);
  });
})(jQuery);
  
  
