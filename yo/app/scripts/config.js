'use strict';

 angular.module('config', [])

.constant('ENV', {name:'development',apiEndpoint:'http://192.168.1.2:8080',videoStorageUrl:'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.test.output/'})

;