var app = angular.module('app');

app.directive('onKeyEnter', function () {
    return function (scope, element, attrs) {
        //console.log('on enter');
        element.bind("keydown keypress", function (event) {
            //console.log(event.which);
            if(event.which === 13) {
                scope.$apply(function (){
                    scope.$eval(attrs.onKeyEnter);
                });

                //event.preventDefault();
            }
        });
    };
});