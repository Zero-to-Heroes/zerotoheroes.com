'use strict';

 angular.module('config', [])

.constant('ENV', {name:'development',apiEndpoint:'localhost:8080',bucket:'com.zerotoheroes.test.input',folder:'videos',videoStorageUrl:'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.test.output/'})

.constant('version', '20171001-14')

;