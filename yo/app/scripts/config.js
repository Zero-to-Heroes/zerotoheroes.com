'use strict';

 angular.module('config', [])

.constant('ENV', {name:'production',apiEndpoint:'http://coaching-landing-env.elasticbeanstalk.com',videoStorageUrl:'https://s3.amazonaws.com/com.zerotoheroes/'})

;