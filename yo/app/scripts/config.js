'use strict';

 angular.module('config', [])

.constant('ENV', {name:'development',apiEndpoint:'http://localhost:8080',videoStorageUrl:'https://s3.amazonaws.com/com.zerotoheroes.test/'})

;