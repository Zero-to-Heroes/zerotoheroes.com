'use strict';

 angular.module('config', [])

.constant('ENV', {name:'production',apiEndpoint:'http://www.zerotoheroes.com',videoStorageUrl:'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/'})

;