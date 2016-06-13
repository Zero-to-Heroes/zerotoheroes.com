var services = angular.module('services');
services.factory('MediaUploader', ['$log', '$analytics', 'ENV',
	function ($log, $analytics, ENV) {

		var creds = {
			bucket: ENV.bucket,
			access_key: 'AKIAJHSXPMPE223KS7PA',
			secret_key: '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'
		}

		var service = {
			callbacks: {}
		}

		service.addCallback = function(name, cb) {
			service.callbacks[name] = cb
		}

		service.upload = function(file, fileKey, videoInfo) {
			service.videoInfo = videoInfo
			service.videoInfo.file = file
			service.videoInfo.fileKey = fileKey
			service.videoInfo.fileKeys = [fileKey]
			service.videoInfo.fileTypes = []
			if (service.videoInfo.files) {
				service.videoInfo.files.forEach(function(file) {
					var type = file.type
					if (!type) {
						var indexOfLastDot = file.name.lastIndexOf('.')
						extension = file.name.slice(indexOfLastDot + 1)
						if (['log', 'txt'].indexOf(extension) > -1)
							type = 'text/plain'
						else if (['xml'].indexOf(extension) > -1)
							type = 'text/xml'
					}
					service.videoInfo.fileTypes.push(type)
				})
			}

			$log.debug('starting upload', file, fileKey, videoInfo, service)

			$log.debug('Setting S3 config')
			$analytics.eventTrack('upload.start', {
				category: 'upload'
			})

			// Configure The S3 Object 
			AWS.config.update({ accessKeyId: creds.access_key, secretAccessKey: creds.secret_key })
			AWS.config.region = 'us-west-2'
			AWS.config.httpOptions.timeout = 3600 * 1000

			var upload = new AWS.S3({ params: { Bucket: creds.bucket } })
			var params = { Key: fileKey, ContentType: file.type, Body: file }

			upload.upload(params, function(err, data) {
				// There Was An Error With Your S3 Config
				if (err) {
					$log.error('An error during upload', err)
				}
				else {
					// Success!
					$log.debug('upload done!')
					videoInfo.upload.done = true
					if (service.callbacks) {
						for (var cb in service.callbacks) {
							if (service.callbacks.hasOwnProperty(cb)) {
								service.callbacks[cb]()
							}
						}
					}
				}
			})
			.on('httpUploadProgress', function(progress) {
				service.videoInfo.upload.progress = progress.loaded / progress.total * 100
				if (service.callbacks) {
					for (var cb in service.callbacks) {
						if (service.callbacks.hasOwnProperty(cb)) {
							service.callbacks[cb]()
						}
					}
				}
			})
		}

		return service;
	}
])