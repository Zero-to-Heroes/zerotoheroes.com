// Generated on 2015-01-23 using generator-angular 0.10.0
'use strict';

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function (grunt) {

  	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);

  	// Time how long tasks take. Can help when optimizing build times
  	require('time-grunt')(grunt);

  	var modRewrite = require('connect-modrewrite')
	var serveStatic = require('serve-static')

  // Configurable paths for the application
  var appConfig = {
	app: require('./bower.json').appPath || 'app',
	dist: 'dist'
  };

  // Define the configuration for all the tasks
  grunt.initConfig({

	// Project settings
	yeoman: appConfig,

	// Watches files for changes and runs tasks based on the changed files
	watch: {
	  bower: {
		files: ['bower.json'],
		tasks: ['wiredep']
	  },
	  js: {
		files: ['<%= yeoman.app %>/**/*.js'],
		//tasks: ['newer:jshint:all'],
		options: {
		  livereload: '<%= connect.options.livereload %>'
		}
	  },
	  jsTest: {
		files: ['test/spec/**/*.js'],
		//tasks: ['newer:jshint:test', 'karma']
	  },
	  styles: {
		files: ['<%= yeoman.app %>/styles/**/*.css'],
		tasks: ['newer:copy:styles', 'autoprefixer']
	  },
	  gruntfile: {
		files: ['Gruntfile.js'],
		tasks: ['ngconstant:development']
	  },
	  livereload: {
		options: {
		  livereload: '<%= connect.options.livereload %>'
		},
		files: [
		  '.mpt/index.html',
		  '<%= yeoman.app %>/**/*.html',
		  '.tmp/styles/**/*.css',
		  '<%= yeoman.app %>/images/**/*.{png,jpg,jpeg,gif,webp,svg}'
		]
	  }
	},

	// The actual grunt server settings
	connect: {
	  options: {
		port: 9000,
		// Change this to '0.0.0.0' to access the server from outside.
		hostname: '0.0.0.0',
		livereload: 35729
	  },
	  livereload: {
		options: {
		  open: true,
		  middleware: function (connect) {
			return [
				modRewrite(['^[^\\.]*$ /index.html [L]']),
				serveStatic('.tmp'),
				connect().use(
					'/bower_components',
					serveStatic('./bower_components')
				),
				serveStatic(appConfig.app)
			];
		  }
		}
	  },
	  test: {
		options: {
		  port: 9991,
		  middleware: function (connect) {
			return [
			  serveStatic('.tmp'),
			  serveStatic('test'),
			  connect().use(
				'/bower_components',
				serveStatic('./bower_components')
			  ),
			  serveStatic(appConfig.app)
			];
		  }
		}
	  },
	  dist: {
		options: {
		  open: true,
		  base: '<%= yeoman.dist %>',
		  middleware: function (connect) {
			return [
				modRewrite(['^[^\\.]*$ /index.html [L]']),
				serveStatic('.tmp'),
				connect().use(
					'/bower_components',
					serveStatic('./bower_components')
				),
				serveStatic(appConfig.dist)
			];
		  }
		}
	  }
	},

	// Empties folders to start fresh
	clean: {
	  dist: {
		files: [{
		  dot: true,
		  src: [
			'.tmp',
			'<%= yeoman.dist %>/**/*',
			'!<%= yeoman.dist %>/.git{,*/}*'
		  ]
		}]
	  },
	  server: '.tmp'
	},

	// Add vendor prefixed styles
	autoprefixer: {
	  options: {
		browsers: ['last 1 version']
	  },
	  dist: {
		files: [{
		  expand: true,
		  cwd: '.tmp/styles/',
		  src: '**/*.css',
		  dest: '.tmp/styles/'
		}]
	  }
	},

	// Automatically inject Bower components into the app
	wiredep: {
	  	app: {
			src: ['.tmp/index.html'],
			ignorePath:  /\.\.\//
	  	}
	},

	less: {
		development: {
			files: {
				"<%= yeoman.app %>/plugins/sports/hearthstone/hearthstone.css": '<%= yeoman.app %>/plugins/sports/hearthstone/styles.less',
				"<%= yeoman.app %>/styles/less/application.css": '<%= yeoman.app %>/styles/less/styles.less'
			}
		}
	},

	// Renames files for browser caching purposes
	filerev: {
	  	dist: {
			src: [
		  		'<%= yeoman.dist %>/scripts/**/*.js',
		  		'<%= yeoman.dist %>/styles/**/*.css',
		  		//'<%= yeoman.dist %>/images/*.{png,jpg,jpeg,gif,webp,svg}',
		  		'<%= yeoman.dist %>/styles/fonts/*'
			]
	  	}
	},

	// Reads HTML for usemin blocks to enable smart builds that automatically
	// concat, minify and revision files. Creates configurations in memory so
	// additional tasks can operate on them
	useminPrepare: {
	  	html: '.tmp/index.html',
	  	options: {
			dest: '<%= yeoman.dist %>',
			flow: {
		  		html: {
					steps: {
			  			js: ['concat', 'uglify'],
			  			css: ['cssmin']
					},
					post: {}
		  		}
			}
	  	}
	},

	// Performs rewrites based on filerev and the useminPrepare configuration
	usemin: {
	  	html: ['.tmp/index.html', '<%= yeoman.dist %>/**/*.html'],
	  	css: ['<%= yeoman.dist %>/styles/**/*.css'],
	  	options: {
			assetsDirs: ['<%= yeoman.dist %>','<%= yeoman.dist %>/images']
	  	}
	},

	uglify: {
		options: {
			sourceMap: true
		}
	},

	// concat: {
	// 	options: {
	// 		sourceMap: true
	// 	}
	// },

	// The following *-min tasks will produce minified files in the dist folder
	// By default, your `index.html`'s <!-- Usemin block --> will take care of
	// minification. These next options are pre-configured if you do not wish
	// to use the Usemin blocks.
	// cssmin: {
	//   dist: {
	//     files: {
	//       '<%= yeoman.dist %>/styles/main.css': [
	//         '.tmp/styles/{,*/}*.css'
	//       ]
	//     }
	//   }
	// },

	imagemin: {
	  dist: {
		files: [{
		  expand: true,
		  cwd: '<%= yeoman.app %>/images',
		  src: '**/*.{png,jpg,jpeg,gif}',
		  dest: '<%= yeoman.dist %>/images'
		}]
	  }
	},

	svgmin: {
	  dist: {
		files: [{
		  expand: true,
		  cwd: '<%= yeoman.app %>/images',
		  src: '{,*/}*.svg',
		  dest: '<%= yeoman.dist %>/images'
		}]
	  }
	},

	htmlmin: {
	  	dist: {
			options: {
			  	collapseWhitespace: true,
			  	conservativeCollapse: true,
			  	collapseBooleanAttributes: true,
			  	removeCommentsFromCDATA: true,
			  	removeOptionalTags: true
			},
			files: [
				{
				  	expand: true,
				  	cwd: '<%= yeoman.dist %>',
				  	src: ['*.html', 'views/{,*/}*.html', 'templates/{,*/}*.html'],
				  	dest: '<%= yeoman.dist %>'
				},
				{
				  	expand: true,
				  	cwd: '.tmp',
				  	src: ['*.html'],
				  	dest: '<%= yeoman.dist %>'
				}
			]
	  	}
	},

	// ng-annotate tries to make the code safe for minification automatically
	// by using the Angular long form for dependency injection.
	ngAnnotate: {
	  dist: {
		files: [{
		  expand: true,
		  cwd: '.tmp/concat/scripts',
		  src: ['*.js', '!oldieshim.js'],
		  dest: '.tmp/concat/scripts'
		}]
	  }
	},

	// Replace Google CDN references
	// cdnify: {
	//   	dist: {
	// 		html: ['.tmp/index.html', '<%= yeoman.dist %>/*.html']
	//   	}
	// },

	// Copies remaining files to places other tasks can use
	copy: {
		index: {
			files: [{
				expand: true,
				cwd: '<%= yeoman.app %>',
				dest: '.tmp',
				src: ['index.html']
			}]
		},
		dist: {
			files: [{
				expand: true,
				dot: true,
				cwd: '<%= yeoman.app %>',
				dest: '<%= yeoman.dist %>',
				src: [
					'*.{ico,png,txt}',
					'.htaccess',
					'404.html',
					'views/**/*.html',
					'templates/**/*.html',
					'images/**/*',
					'fonts/**/*.*',
					'sitemap.xml',
					'plugins/**/*.*',
					'languages/**/*.*',
					'sports/**/*.*',
				]
			},
			{
				expand: true,
				cwd: '.tmp',
				dest: '<%= yeoman.dist %>',
				src: ['index.html']
			},
			{
				expand: true,
				cwd: '.tmp/images',
				dest: '<%= yeoman.dist %>/images',
				src: ['generated/*']
			},
			{
				expand: true,
				cwd: 'bower_components/bootstrap/dist',
				src: 'fonts/*',
				dest: '<%= yeoman.dist %>'
			}]
		},
		styles: {
			expand: true,
			cwd: '<%= yeoman.app %>/styles',
			dest: '.tmp/styles/',
			src: '**/*.css'
		}
	},

	// Run some tasks in parallel to speed up the build process
	concurrent: {
	  server: [
		'copy:styles'
	  ],
	  test: [
		'copy:styles'
	  ],
	  dist: [
		'copy:styles',
		//'imagemin'
		//'svgmin'
	  ]
	},

	processhtml: {
		dist: {
			options: {
				process: true
			},
			files: {
				// Target-specific file lists and/or options go here.
				'.tmp/index.html': ['.tmp/index.html']
			}
		}
	},

	ngtemplates:  {
		app: {
			cwd: '<%= yeoman.app %>',
			src: ['templates/**/*.html', 'views/**/*.html'],
			dest: '<%= yeoman.app %>/scripts/template.js',
			options: {
				module: 'app',
				htmlmin: {
					collapseBooleanAttributes:      true,
					collapseWhitespace:             true,
					removeComments:                 true, // Only if you don't use comment directives!
					removeEmptyAttributes:          true,
					removeRedundantAttributes:      true,
					removeScriptTypeAttributes:     true,
					removeStyleLinkTypeAttributes:  true
				}
			}
		},
		dist: {
			cwd: '<%= yeoman.app %>',
			src: ['templates/**/*.html', 'views/**/*.html'],
			dest: '<%= yeoman.app %>/scripts/template.js',
			options: {
				module: 'app',
				// usemin: '<%= yeoman.dist %>/vendors.js', // <~~ This came from the <!-- build:js --> block
				htmlmin: {
					collapseBooleanAttributes:      true,
					collapseWhitespace:             true,
					removeComments:                 true, // Only if you don't use comment directives!
					removeEmptyAttributes:          true,
					removeRedundantAttributes:      true,
					removeScriptTypeAttributes:     true,
					removeStyleLinkTypeAttributes:  true
				}
			}
		}
	},

	ngconstant: {
		// Options for all targets
		options: {
			space: '  ',
			wrap: '\'use strict\';\n\n {%= __ngModule %}',
			name: 'config',
		},
		// Environment targets
		development: {
			options: {
				dest: '<%= yeoman.app %>/scripts/config.js'
			},
			constants: {
				ENV: grunt.file.readJSON('app/conf/constants.dev.json'),
				version: grunt.template.today('yyyymmdd-HH')
			}
		},
		production: {
			options: {
				dest: '<%= yeoman.app %>/scripts/config.js'
			},
			constants: {
				ENV: grunt.file.readJSON('app/conf/constants.prod.json'),
				version: grunt.template.today('yyyymmdd-HH')
			}
		}
	},

	replace: {
        defaultI18n: {
            options: {
                patterns: [{
                    match: 'content',
                    replacement: '<%= JSON.stringify(grunt.file.readJSON(\'./app/languages/en.json\')) %>'
                }]
            },
            files: [{
                expand: true,
                flatten: true,
                src: ['<%= yeoman.app %>/conf/defaultI18n.js'],
                dest: '<%= yeoman.app %>/scripts/services/'
            }]
        }
    },

	// Test settings
	karma: {
	  unit: {
		configFile: 'test/karma.conf.js',
		singleRun: true
	  }
	}
  });


  grunt.registerTask('serve', 'Compile then start a connect web server', function (target) {
	if (target === 'dist') {
		grunt.task.run([
			'connect:dist:keepalive'
		]);
	}
	else {
		grunt.task.run([
		  	'clean:server',
			'ngconstant:development',
			// 'ngconstant:production',
			'replace:defaultI18n',
			'less',
			'copy:index',
		  	'wiredep',
		  	'concurrent:server',
		  	'autoprefixer',
		  	'connect:livereload',
		  	'watch'
		]);
	}
  });

	grunt.registerTask('test', [
		// 'clean:server',
		// 'replace:defaultI18n',
		// 'concurrent:test',
		// 'autoprefixer',
		// 'connect:test',
		// 'karma'
	]);

	grunt.registerTask('build', [
		'clean:dist',
		'ngconstant:production',
		'replace:defaultI18n',
		'less',
		'copy:index',
		'wiredep',
		'processhtml:dist',
		'ngtemplates:dist',
		'useminPrepare',
		'concurrent:dist',
		'autoprefixer',
		'concat',
		'ngAnnotate',
		'copy:dist',
		// 'cdnify',
		'uglify',
		'cssmin',
		'filerev',
		'usemin',
		'htmlmin'
	]);

	grunt.registerTask('build-dev', [
		'clean:dist',
		'ngconstant:development',
		// 'ngconstant:production',
		'replace:defaultI18n',
		'less',
		'copy:index',
		'wiredep',
		'processhtml:dist',
		'ngtemplates:dist',
		'useminPrepare',
		'concurrent:dist',
		'autoprefixer',
		'concat',
		'ngAnnotate',
		'copy:dist',
		// 'cdnify',
		'uglify',
		'cssmin',
		'filerev',
		'usemin',
		'htmlmin',
		'connect:dist:keepalive'
	]);

  grunt.registerTask('default', [
	//'newer:jshint',
	'test',
	'build'
  ]);
};
