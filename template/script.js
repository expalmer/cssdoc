(function() {

  'use strict';

  function init() {

    var $menu  = document.querySelector('.cssdoc_menu');
    var $links = $menu.querySelectorAll('a');
    var $docs  = document.querySelectorAll('.cssdoc_doc');
    var $mobile = document.querySelector('#cssdoc_mm');

    var map = function(el, fn){
      var a = [];
      var i = el.length;
      while (i--) {
        a.push(fn(el[i]));
      }
      return a;
    }

    map($links, function(link) {
      link.addEventListener('click', click);
    })

    var allDocs = map($docs, function(doc){
      return doc;
    });

    function click(e) {
      selectLink( e.target.getAttribute('href').split('#')[1] );
    }

    function scroll(e) {
      var gap = 10;
      var target = allDocs
        .filter(function(x){
          return x.getBoundingClientRect().top - gap < 0;
        })
        .reduce(function(a, b){
          if ( a && b ) {
            a = a.getBoundingClientRect().top - gap > b.getBoundingClientRect().top - gap ? a : b;
          } else if ( b ) {
            a = b;
          }
          return a;
        },false);
      selectLink(target.id);
    }

    function selectLink( href ) {
      if ( !href ) {
        return false;
      }
      var href = '#' + href,
          parent = href.split('_')[0],
          i = $links.length,
          link;
      map($links, function(link) {
        var linkHref = link.getAttribute('href');
        link.classList.remove('selected');
        if( linkHref === href || linkHref === parent ) {
          link.classList.add('selected');
        }
      });
    }

    function menuMain(e) {
      $mobile.classList.remove('opened');
      $menu.classList.remove('opened');
    }

    function menuMobile(e) {
      e.preventDefault();
      if ($mobile.classList.contains('opened')) {
        $mobile.classList.remove('opened');
        $menu.classList.remove('opened');
      } else {
        $mobile.classList.add('opened');
        $menu.classList.add('opened');
      }
    }

    $mobile.addEventListener('click', menuMobile, false );
    $menu.addEventListener('click', menuMain, false );

    window.addEventListener('scroll', scroll, false );

  }

  document.addEventListener('DOMContentLoaded', init, false);

})();