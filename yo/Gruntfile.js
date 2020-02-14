// Generated on 2015-01-23 using generator-angular 0.10.0
"use strict";

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// 'test/spec/**/*.js'

module.exports = function(grunt) {
  // Load grunt tasks automatically
  require("load-grunt-tasks")(grunt);

  // Configurable paths for the application
  var appConfig = {
    app: "app",
    dist: "dist"
  };

  // Define the configuration for all the tasks
  grunt.initConfig({
    // Project settings
    yeoman: appConfig,

    // Empties folders to start fresh
    clean: {
      dist: {
        files: [
          {
            dot: true,
            src: [
              ".tmp",
              "<%= yeoman.dist %>/**/*",
              "!<%= yeoman.dist %>/.git{,*/}*"
            ]
          }
        ]
      },
      server: ".tmp"
    },

    // Copies remaining files to places other tasks can use
    copy: {
      index: {
        files: [
          {
            expand: true,
            cwd: "<%= yeoman.app %>",
            dest: ".tmp",
            src: ["index.html"]
          }
        ]
      },
      dist: {
        files: [
          {
            expand: true,
            dot: true,
            cwd: "<%= yeoman.app %>",
            dest: "<%= yeoman.dist %>",
            src: [
              "*.{ico,png,txt}",
              ".htaccess",
              "404.html",
              "views/**/*.html",
              "templates/**/*.html",
              "images/**/*",
              "fonts/**/*.*",
              "sitemap.xml",
              "plugins/**/*.*",
              "languages/**/*.*",
              "sports/**/*.*"
            ]
          },
          {
            expand: true,
            cwd: ".tmp",
            dest: "<%= yeoman.dist %>",
            src: ["index.html"]
          },
          {
            expand: true,
            cwd: ".tmp/images",
            dest: "<%= yeoman.dist %>/images",
            src: ["generated/*"]
          },
          {
            expand: true,
            cwd: "bower_components/bootstrap/dist",
            src: "fonts/*",
            dest: "<%= yeoman.dist %>"
          }
        ]
      },
      styles: {
        expand: true,
        cwd: "<%= yeoman.app %>/styles",
        dest: ".tmp/styles/",
        src: "**/*.css"
      }
    }
  });

  grunt.registerTask("build", ["clean:dist", "copy:index", "copy:dist"]);
};
