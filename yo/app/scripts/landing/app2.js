


//parallax
$(window).stellar({
    horizontalScrolling: false,
    responsive: true
});

$(document).ready(function () {

    $("#testimonials").owlCarousel({
        navigation: false, // Show next and prev buttons
        slideSpeed: 300,
        paginationSpeed: 400,
        singleItem: true
    });

});

$(document).ready(function() {
  $("#screens").owlCarousel({
      item:4,
      itemsDesktop:[1199,4],
      itemsDesktopSmall:[979,4],
      itemsMobile:[479,1]
  });
 
});

/* ==============================================
 WOW plugin triggers animate.css on scroll
 =============================================== */
var wow = new WOW(
        {
            boxClass: 'wow', // animated element css class (default is wow)
            animateClass: 'animated', // animation css class (default is animated)
            offset: 100, // distance to the element when triggering the animation (default is 0)
            mobile: false        // trigger animations on mobile devices (true is default)
        }
);
wow.init();

