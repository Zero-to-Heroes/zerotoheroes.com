# pyrogress Application

Easy way to run TrueSkill matches between any number of players (I use it for my LAN tournaments for instance). The main advantage of this compared to standard bracket tournaments is that:
* There is no elimination (ideal in friendly LAN parties, where not everyone is a gamer / competitor)
* It works with whatever number of games the players have played

It's also a bootstrap project that uses the following technos:
* Spring for autowiring and servlet dispatch
* Spring security for stateless token-based authentication
* Couchbase along with spring-data-couchbase for the repository
* REST entry point testing with spring's restTemplate
* Specific config deployment depending on the build profile (to be improved)
* AngularJS + Bower + Grunt for the UI
* Specific config deployment based on the build profile
* Deployment to Amazon Elastic Beanstalk through Maven

#Configuration

## UI

If you want to play only with the UI (and not the backend), you can stop after this section

1. Install [nodejs](http://nodejs.org/) with its npm package manager
2. Install bower `npm install -g bower`
3. Install grunt `npm install -g grunt-cli`
4. Install yo `npm install -g yo`
5. Run `npm install && bower install` from within the project root directory
6. Run `grunt ui-only` to deploy a fully standalone UI
    WARNING: the process is in place, but all mocks have not been coded yet, so this is not functional today (but will come soon, the hardest part of the work is done)

## Server (link to project)

If you want to use only a local installation (and not deploy to AWS), you can stop after this section

###Install

1. Install [Couchbase](http://www.couchbase.com/nosql-databases/downloads); if you're on Windows, you can use directly [this link](http://packages.couchbase.com/releases/3.0.1/couchbase-server-community_3.0.1-windows_amd64.exe) to download the Community edition 3.0.1
  * You may have an issue where you server doesn't start. In this case, look at [this post](http://tugdualgrall.blogspot.fr/2012/12/what-to-do-if-your-couchbase-server.html)
3. Install the trueskills library. From the simple-rankings-was project directory, run
```
mvn install:install-file -Dfile=lib/trueskill-1.0.jar -DgroupId=com.rubberfruits -DartifactId=trueskill -Dversion=1.0 -Dpackaging=jar
```
4. Add the following entry to your maven settings.xml
```
    <server>
      <id>aws.amazon.com</id>
      <username>your_aws_username</username>
      <password>your_aws_password</password>
    </server>
```

###Build commands
* `mvn test` to build the server code and run the unit tests
* `mvn verify -Pserver` to build the server and run the integration tests. No UI will be deployed. For now it doesn't launch Jetty for end to end tests (with a need of web server)
* `mvn package` to perform a build of the server, and update of the UI submodule, a build of the UI with production config and packaging a webapp with backend + frontend. It will also start a Jetty, which is not used today (will be used for full end-to-end tests)
  * Note: it sometimes fail on my computer because of a lock conflict in npm-cache. Just relaunching the build usually solves the issue
* `mvn verify` to additionally run integration tests

###Putting UI and Server together (to be detailed)
1. You may have issues when the UI target the same domain (localhost) as the server. To solve this, install the CORS extension for your browser
  1. Configure it to accept the header X-AUTH-TOKEN
2. Once your local backend is running (see below), run `grunt serve` to create a local server that will connect to the local backend

### Using Eclipse
1. Import the maven project in Eclipse
2. Run Application.java as Java Application. Spring Boot will launch its embedded Tomcat server

### Without Eclipse (TODO)
1. `mvn spring-boot:run` (according to the documentation, not tested yet)

## Deploy to AWS
1. Setup your AWS credentials
4. Run `mvn package beanstalk:fast-deploy -P fast-deploy` to deploy to AWS
2. TODO

#Other doc
* http://docs.ingenieux.com.br/project/beanstalker/

#TODO
* Integrate [Satellizer](https://github.com/sahat/satellizer) for authentication?
* Other form validation improvements
  * http://blog.yodersolutions.com/bootstrap-form-validation-done-right-in-angularjs/
  * http://www.mircozeiss.com/shake-that-login-form-with-angularjs/
* Full testing when building
  * Java unit tests, Java integration tests, UI unit tests, UI tests, integration tests of UI + server
  * Possible to parameter the maven yeoman plugin?
* Remove players
* Remove tournaments
* Handle draws
* Continuous integration + deployment pipeline
  * http://www.pressinnov.com/2013/11/angularjs-en-integration-continue-sous-jenkins/
  * Codeship?
* Reintegrate protractor for continuous testing
* Build using Gradle instead of maven



rmdir /S /Q <dir>
http://superuser.com/questions/45697/how-to-delete-a-file-in-windows-with-a-too-long-filename