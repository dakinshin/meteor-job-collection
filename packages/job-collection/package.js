/***************************************************************************
###     Copyright (C) 2014-2017 by Vaughn Iverson
###     job-collection is free software released under the MIT/X11 license.
###     See included LICENSE file for details.
***************************************************************************/

var currentVersion = '1.7.0';

Package.describe({
  summary: "A persistent and reactive job queue for Meteor, supporting distributed workers that can run anywhere",
  name: 'thebakery:job-collection',
  version: currentVersion,
  documentation: '../../README.md',
  git: 'https://github.com/bakery/meteor-job-collection.git'
});


Package.onUse(function(api) {
  Npm.depends({ later: '1.2.0' });
  api.use([
    'ecmascript',
    'mongo',
    'check'
  ]);
  api.mainModule('src/server.js', 'server');
  api.mainModule('src/client.js', 'client');

  // Make both Job and JobCollection publicly available
  api.export('Job');
  api.export('JobCollection');

});

Package.onTest(function (api) {
  api.use([
    'thebakery:job-collection@' + currentVersion,
    'ecmascript',
    'check',
    'meteortesting:mocha@1.0.0',
  ]);
  api.use('ddp', 'client');
  
  Npm.depends({
    later: '1.2.0',
    chai: '4.1.2',
  });

  api.addFiles('test/job_collection.test.js', ['server', 'client']);
});
