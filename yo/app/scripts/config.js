'use strict';

 angular.module('config', [])

.constant('ENV', {name:'production',apiEndpoint:'www.zerotoheroes.com',bucket:'com.zerotoheroes.input',folder:'videos',videoStorageUrl:'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.output/',reviewInit:'https://husxs4v58a.execute-api.us-west-2.amazonaws.com/prod',createReviewBucket:'com.zerotoheroes.batch'})

.constant('version', '20190124-17')

;