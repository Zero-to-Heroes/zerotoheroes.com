var services = angular.module('services');
services.factory('ReplayUploader', ['$log', '$analytics', 'ENV', '$http', 'User',
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
			service.totalSize = 0;
			service.totalTransferred = 0;
			service.progress = 0;

			var filesToUpload = [];
			files.forEach(function(file) {
				$log.log('considering file', file);
				if (file.numberOfGames === 1 || file._file.numberOfGames === 1) {
					filesToUpload.push(file);
				}
				else {
					console.log('splitting', file);
					var splitFiles = split(file);
					console.log('split', splitFiles);
					splitFiles.forEach(function(split) {
						filesToUpload.push(split);
					})
				}
			})

			$log.debug('Getting empty review IDs');
			service.numberOfReviews = numberOfReviews;

			AWS.config.region = 'us-west-2'
			AWS.config.httpOptions.timeout = 3600 * 1000

			s3 = new AWS.S3()

			filesToUpload.forEach(function(file) {
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
				ContentType: file._file.contentType ? file._file.contentType : file._file.fileType,
				Body: file._file,
				Metadata: {
					'review-id': file._file.reviewId,
					'user-id': User.getUser().id,
					'file-type': file._file.fileType,
					'game-type': file._file.gameType
				}
			}

			$log.debug('uploading with params', params, file._file, file)
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

		var split = function(file) {
			var splitFiles = [];

			var currentText = [];
			var lines = file.contents.split('\n');
			console.log('lines', lines.length);
			lines.forEach(function(line) {
				if (line.indexOf('GameState.DebugPrintPower() - CREATE_GAME') > -1) {
					if (currentText.length > 20) {
						var splitFile = {
							_file: new File(currentText, Date.now() + '-' + file._file.fileKey)
						};
						splitFile._file.fileType = file._file.fileType;
						splitFile._file.gameType = file._file.gameType;
						splitFile._file.contentType = file._file.contentType;
						splitFile._file.fileKey = file._file.fileKey + '-' + splitFiles.length;
						console.log('Built file', splitFile, currentText.length);
						splitFiles.push(splitFile);
					}
					currentText = [];
				}
				currentText.push(line);
			})
			var splitFile = {
				_file: new File(currentText, Date.now() + '-' + file._file.fileKey)
			};
			splitFile._file.fileType = file._file.fileType;
			splitFile._file.gameType = file._file.gameType;
			splitFile._file.contentType = file._file.contentType;
			splitFile._file.fileKey = file._file.fileKey + '-' + splitFiles.length;
			console.log('Built file', splitFile, currentText.length);
			splitFiles.push(splitFile);

			return splitFiles;
		}

		return service;
	}
])
