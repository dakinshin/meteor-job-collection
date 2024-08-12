/***************************************************************************
###     Copyright (C) 2014-2017 by Vaughn Iverson
###     job-collection is free software released under the MIT/X11 license.
###     See included LICENSE file for details.
***************************************************************************/

var currentVersion = '1.7.0';

Package.describe({
  summary: "A persistent and reactive job queue for Meteor, supporting distributed workers that can run anywhere",
  name: 'dakinshin:job-collection',
  version: currentVersion,
  documentation: '../../README.md',
  git: 'git@github.com:dakinshin/meteor-job-collection.git'
});


Package.onUse(function(api) {
  Npm.depends({ '@breejs/later': '4.2.0' });
  api.use([
    'ecmascript@0.14.3',
    'mongo@2.0.0',
    'check@1.3.1'
  ]);
  api.mainModule('src/server.js', 'server');
  api.mainModule('src/client.js', 'client');

  // Make both Job and JobCollection publicly available
  api.export('Job');
  api.export('JobCollection');

});

// Package.onTest(function (api) {
//   api.use([
//     'thebakery:job-collection@' + currentVersion,
//     'ecmascript@0.14.3',
//     'check@1.3.1',
//     'meteortesting:mocha@1.0.0',
//   ]);
//   api.use('ddp', 'client');
  
//   Npm.depends({
//     later: '1.2.0',
//     chai: '4.1.2',
//   });

//   api.addFiles('test/job_collection.test.js', ['server', 'client']);
// });
