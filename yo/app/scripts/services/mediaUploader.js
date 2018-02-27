var services = angular.module('services');
services.factory('MediaUploader', ['$log', '$analytics', 'ENV', '$http', 'User',
	function ($log, $analytics, ENV, $http, User) {

		var service = {
			callbacks: [],
			totalSize: 0,
			totalTransferred: 0,
			progress: 0
		}

		var s3;

		service.addCallback = function(cb) {
			service.callbacks.push(cb);
		}

		service.upload = function(files, numberOfReviews) {
			$log.debug('Getting empty review IDs');
			service.numberOfReviews = numberOfReviews;

			AWS.config.region = 'us-west-2'
			AWS.config.httpOptions.timeout = 3600 * 1000

			s3 = new AWS.S3()

			files.forEach(function(file) {
				service.totalSize += file._file.size;
				uploadFile(file);
			});
		}

		var uploadFile = function(file) {
			$log.debug('uploading file', file, ENV.reviewInit);
			$http.post(ENV.reviewInit, null, { noAuth: true }).then(
				function(res) {
					$log.debug('Review initialized', res.data);
					file._file.reviewId = res.data;
					uploadFileToS3(file);
				},
				function(error) {
					$log.error('Could not initialize empty review', error);
				}
			);
		}

		var uploadFileToS3 = function(file) {

			var params = {
				Bucket: ENV.createReviewBucket,
				Key: file._file.fileKey,
				ACL: 'public-read-write',
				ContentType: file._file.fileType,
				Body: file._file,
				Metadata: {
					'review-id': file._file.reviewId,
					'user-id': User.getUser().id
				}
			}

			$log.debug('uploading with params', params)
			var req = s3.makeUnauthenticatedRequest('putObject', params);
			req.send(function(err, data) {
				// There Was An Error With Your S3 Config
				if (err) {
					$log.error('An error during upload', err)
				}
				else {
					// Success!
					file.uploaded = true;
					service.totalTransferred += file._file.size;
					service.progress = 100.0 * service.totalTransferred / service.totalSize;
					$log.debug('upload done!', data, service);
					service.callbacks.forEach(function(cb) {
						cb(file);
					});
				}
			})
		}

		return service;
	}
])
