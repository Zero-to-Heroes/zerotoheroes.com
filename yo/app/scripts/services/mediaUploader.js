var services = angular.module('services');
services.factory('MediaUploader', ['$log', '$analytics', 'ENV',
	function ($log, $analytics, ENV) {

		// var creds = {
		// 	bucket: ENV.bucket,
		// 	access_key: 'AKIAJHSXPMPE223KS7PA',
		// 	secret_key: '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'
		// }

		var service = {
			callbacks: {}
		}

		service.addCallback = function(name, cb) {
			service.callbacks[name] = cb
		}

		service.upload = function(files, fileKeys, videoInfo) {
			service.videoInfo = videoInfo
			// service.videoInfo.file = file
			// service.videoInfo.fileKey = fileKey
			service.videoInfo.fileKeys = fileKeys
			service.videoInfo.fileTypes = []
			service.videoInfo.upload = service.videoInfo.upload || {}
			
			files.forEach(function(file) {
				var type = file.type
				if (!type) {
					var indexOfLastDot = file.name.lastIndexOf('.')
					var extension = file.name.slice(indexOfLastDot + 1)
					if (['log', 'txt'].indexOf(extension) > -1)
						type = 'text/plain; charset=utf-8'
					else if (['xml'].indexOf(extension) > -1)
						type = 'text/xml; charset=utf-8'
					else if (['hdtreplay'].indexOf(extension) > -1)
						type = 'hdtreplay'
					else if (['hszip'].indexOf(extension) > -1)
						type = 'hszip'
					else if (['arenatracker'].indexOf(extension) > -1)
						type = 'text/plain; charset=utf-8'
				}
				service.videoInfo.fileTypes.push(type)
				file.fileType = type
			})
			

			$log.debug('starting upload', files, fileKeys, videoInfo, service)

			$log.debug('Setting S3 config')
			$analytics.eventTrack('upload.start', {
				category: 'upload'
			})

			// Configure The S3 Object 
			// AWS.config.update({ accessKeyId: creds.access_key, secretAccessKey: creds.secret_key })
			AWS.config.region = 'us-west-2'
			AWS.config.httpOptions.timeout = 3600 * 1000

			var s3 = new AWS.S3()

			files.forEach(function(file, index) {
				var params = { 
					Bucket: ENV.bucket,
					Key: fileKeys[index], 
					ACL: 'public-read-write',
					ContentType: service.videoInfo.fileTypes[index], 
					Body: file 
				}

				$log.debug('uploading with params', params)
				var req = s3.makeUnauthenticatedRequest('putObject', params);
				req.on('httpUploadProgress', function(progress) {
					file.uploadSize = progress.total
					file.current = progress.loaded
					var totalLoaded = 0
					var totalProgress = 0
					files.forEach(function(temp) {
						totalLoaded += temp.current
						totalProgress += temp.uploadSize
					})
					service.videoInfo.upload.progress = totalLoaded / totalProgress * 100
					// $log.debug('uploading', service.videoInfo.upload.progress)
					if (service.callbacks) {
						// $log.debug('calling service callbacks', service.callbacks)
						for (var cb in service.callbacks) {
							// $log.debug('    calling?', cb)
							if (service.callbacks.hasOwnProperty(cb)) {
								// $log.debug('            yes calling', cb)
								try {
									service.callbacks[cb](file)
								}
								catch(e) {}
							}
						}
					}
				})
				req.send(function(err, data) {
					// There Was An Error With Your S3 Config
					if (err) {
						$log.error('An error during upload', err)
					}
					else {
						// Success!
						$log.debug('upload done!')
						videoInfo.upload.done = true
						file.uploaded = true
						if (service.callbacks) {
							for (var cb in service.callbacks) {
								if (service.callbacks.hasOwnProperty(cb)) {
									service.callbacks[cb](file)
								}
							}
						}
					}
				})
			})
		}

		return service;
	}
])