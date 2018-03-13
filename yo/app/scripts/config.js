'use strict';

 angular.module('config', [])

.constant('ENV', {name:'development',apiEndpoint:'localhost:8080',bucket:'com.zerotoheroes.test.input',folder:'videos',videoStorageUrl:'https://s3-us-west-2.amazonaws.com/com.zerotoheroes.test.output/',reviewInit:'https://husxs4v58a.execute-api.us-west-2.amazonaws.com/prod',createReviewBucket:'com.zerotoheroes.test.batch'})

.constant('version', '20180312-20')

;