'use strict';

 angular.module('config', [])

.constant('ENV', {name:'production',apiEndpoint:'http://www.zerotoheroes.com',bucket:'com.zerotoheroes.input',folder:'videos',videoStorageUrl:'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/'})

.constant('version', '20160830-17')

;