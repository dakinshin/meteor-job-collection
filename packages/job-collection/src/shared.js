/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS205: Consider reworking code to avoid use of IIFEs
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
  //###########################################################################
  //     Copyright (C) 2014-2017 by Vaughn Iverson
  //     job-collection is free software released under the MIT/X11 license.
  //     See included LICENSE file for details.
  //###########################################################################

import Job from '../job/src/job_class';
import later from '@breejs/later'

const _validNumGTEZero = v => Match.test(v, Number) && (v >= 0.0);

const _validNumGTZero = v => Match.test(v, Number) && (v > 0.0);

const _validNumGTEOne = v => Match.test(v, Number) && (v >= 1.0);

const _validIntGTEZero = v => _validNumGTEZero(v) && (Math.floor(v) === v);

const _validIntGTEOne = v => _validNumGTEOne(v) && (Math.floor(v) === v);

const _validStatus = v => Match.test(v, String) && Job.jobStatuses.includes(v);

const _validLogLevel = v => Match.test(v, String) && Job.jobLogLevels.includes(v);

const _validRetryBackoff = v => Match.test(v, String) && Job.jobRetryBackoffMethods.includes(v);

const _validId = v => Match.test(v, Match.OneOf(String, Mongo.Collection.ObjectID));

const _validLog = () =>
  [{
    time: Date,
    runId: Match.OneOf(Match.Where(_validId), null),
    level: Match.Where(_validLogLevel),
    message: String,
    data: Match.Optional(Object)
  }]
;

const _validProgress = () => 
  ({
    completed: Match.Where(_validNumGTEZero),
    total: Match.Where(_validNumGTEZero),
    percent: Match.Where(_validNumGTEZero)
  })
;

const _validLaterJSObj = () =>
  ({
    schedules: [ Object ],
    exceptions: Match.Optional([ Object ])
  })
;

const _validJobDoc = () =>
 ({
    _id: Match.Optional(Match.OneOf(Match.Where(_validId), null)),
    runId: Match.OneOf(Match.Where(_validId), null),
    type: String,
    status: Match.Where(_validStatus),
    data: Object,
    result: Match.Optional(Object),
    failures: Match.Optional([ Object ]),
    priority: Match.Integer,
    depends: [ Match.Where(_validId) ],
    resolved: [ Match.Where(_validId) ],
    after: Date,
    updated: Date,
    workTimeout: Match.Optional(Match.Where(_validIntGTEOne)),
    expiresAfter: Match.Optional(Date),
    log: Match.Optional(_validLog()),
    progress: _validProgress(),
    retries: Match.Where(_validIntGTEZero),
    retried: Match.Where(_validIntGTEZero),
    repeatRetries: Match.Optional(Match.Where(_validIntGTEZero)),
    retryUntil: Date,
    retryWait: Match.Where(_validIntGTEZero),
    retryBackoff: Match.Where(_validRetryBackoff),
    repeats: Match.Where(_validIntGTEZero),
    repeated: Match.Where(_validIntGTEZero),
    repeatUntil: Date,
    repeatWait: Match.OneOf(Match.Where(_validIntGTEZero), Match.Where(_validLaterJSObj)),
    created: Date
  })
;

const _getAllProperties = function(obj) {
  const names = new Set();
  const properties = [];
  while (obj) {
    for (let name of Object.getOwnPropertyNames(obj)) {
      if (!names.has(name)) {
        properties.push([name, obj[name]]);
        names.add(name);
        }
    }
    obj = Object.getPrototypeOf(obj);
  }
  return properties;
};

class JobCollectionBase extends Mongo.Collection {
  static initClass() {

    this.prototype._validNumGTEZero = _validNumGTEZero;
    this.prototype._validNumGTZero = _validNumGTZero;
    this.prototype._validNumGTEOne = _validNumGTEOne;
    this.prototype._validIntGTEZero = _validIntGTEZero;
    this.prototype._validIntGTEOne = _validIntGTEOne;
    this.prototype._validStatus = _validStatus;
    this.prototype._validLogLevel = _validLogLevel;
    this.prototype._validRetryBackoff = _validRetryBackoff;
    this.prototype._validId = _validId;
    this.prototype._validLog = _validLog;
    this.prototype._validProgress = _validProgress;
    this.prototype._validJobDoc = _validJobDoc;

    this.prototype.jobLogLevels = Job.jobLogLevels;
    this.prototype.jobPriorities = Job.jobPriorities;
    this.prototype.jobStatuses = Job.jobStatuses;
    this.prototype.jobStatusCancellable = Job.jobStatusCancellable;
    this.prototype.jobStatusPausable = Job.jobStatusPausable;
    this.prototype.jobStatusRemovable = Job.jobStatusRemovable;
    this.prototype.jobStatusRestartable = Job.jobStatusRestartable;
    this.prototype.forever = Job.forever;
    this.prototype.foreverDate = Job.foreverDate;

    this.prototype.ddpMethods = Job.ddpMethods;
    this.prototype.ddpPermissionLevels = Job.ddpPermissionLevels;
    this.prototype.ddpMethodPermissions = Job.ddpMethodPermissions;
    
    this.prototype.jobDocPattern = _validJobDoc();
    
    // Deprecated. Remove in next major version
    this.prototype.makeJob = (function() {
      let dep = false;
      return function(...params) {
        if (!dep) {
          dep = true;
          console.warn("WARNING: jc.makeJob() has been deprecated. Use new Job(jc, doc) instead.");
        }
        return new Job(this.root, ...params);
      };
    })();
    
    // Deprecated. Remove in next major version
    this.prototype.createJob = (function() {
      let dep = false;
      return function(...params) {
        if (!dep) {
          dep = true;
          console.warn("WARNING: jc.createJob() has been deprecated. Use new Job(jc, type, data) instead.");
        }
        return new Job(this.root, ...params);
      };
    })();
    
    this.prototype._DDPMethod_startJobs = (() => {
      let depFlag = false;
      return function(options) {
        if (!depFlag) {
          depFlag = true;
          console.warn("Deprecation Warning: jc.startJobs() has been renamed to jc.startJobServer()");
        }
        return this._DDPMethod_startJobServer(options);
      };
    })();
    
    this.prototype._DDPMethod_stopJobs = (() => {
      let depFlag = false;
      return function(options) {
        if (!depFlag) {
          depFlag = true;
          console.warn("Deprecation Warning: jc.stopJobs() has been renamed to jc.shutdownJobServer()");
        }
        return this._DDPMethod_shutdownJobServer(options);
      };
    })();
      }

  constructor(root = 'queue', options = {}) {
    if (options.noCollectionSuffix == null) { options.noCollectionSuffix = false; }

    let collectionName = root;

    if (!options.noCollectionSuffix) {
      collectionName += '.jobs';
    }

    // Remove non-standard options before
    // calling Mongo.Collection constructor
    delete options.noCollectionSuffix;

    Job.setDDP(options.connection, root);

    // Call super's constructor
    super(collectionName, options);

    if (!(this instanceof Mongo.Collection)) {
      throw new Meteor.Error('The global definition of Mongo.Collection has changed since the job-collection package was loaded. Please ensure that any packages that redefine Mongo.Collection are loaded before job-collection.');
    }

    if (Mongo.Collection !== Mongo.Collection.prototype.constructor) {
      throw new Meteor.Error('The global definition of Mongo.Collection has been patched by another package, and the prototype constructor has been left in an inconsistent state. Please see this link for a workaround: https://github.com/vsivsi/meteor-file-sample-app/issues/2#issuecomment-120780592');
    }

    this.root = root;

    this.later = later;  // later object, for convenience

    this._createLogEntry = (message = '', runId = null, level = 'info', time = new Date(), data = null) => ({ time, runId, message, level });

    this._logMessage = {
      'readied': (() => { return this._createLogEntry("Promoted to ready"); }),
      'forced': (id => { return this._createLogEntry("Dependencies force resolved", null, 'warning'); }),
      'rerun': ((id, runId) => { return this._createLogEntry("Rerunning job", null, 'info', new Date(), {previousJob:{id,runId}}); }),
      'running': (runId => { return this._createLogEntry("Job Running", runId); }),
      'paused': (() => { return this._createLogEntry("Job Paused"); }),
      'resumed': (() => { return this._createLogEntry("Job Resumed"); }),
      'cancelled': (() => { return this._createLogEntry("Job Cancelled", null, 'warning'); }),
      'restarted': (() => { return this._createLogEntry("Job Restarted"); }),
      'resubmitted': (() => { return this._createLogEntry("Job Resubmitted"); }),
      'submitted': (() => { return this._createLogEntry("Job Submitted"); }),
      'completed': (runId => { return this._createLogEntry("Job Completed", runId, 'success'); }),
      'resolved': ((id, runId) => { return this._createLogEntry("Dependency resolved", null, 'info', new Date(), {dependency:{id,runId}}); }),
      'failed': ((runId, fatal, err) => {
        const { value } = err;
        const msg = `Job Failed with${fatal ? ' Fatal' : ''} Error${(value != null) && (typeof value === 'string') ? `: ${value}` : ''}.`;
        const level = fatal ? 'danger' : 'warning';
        return this._createLogEntry(msg, runId, level);})
    };
  }

  processJobs(...params) { return Job.processJobs(this.root, ...params); }
  getJob(...params) { return Job.getJob(this.root, ...params); }
  getWork(...params) { return Job.getWork(this.root, ...params); }
  getJobs(...params) { return Job.getJobs(this.root, ...params); }
  readyJobs(...params) { return Job.readyJobs(this.root, ...params); }
  cancelJobs(...params) { return Job.cancelJobs(this.root, ...params); }
  pauseJobs(...params) { return Job.pauseJobs(this.root, ...params); }
  resumeJobs(...params) { return Job.resumeJobs(this.root, ...params); }
  restartJobs(...params) { return Job.restartJobs(this.root, ...params); }
  removeJobs(...params) { return Job.removeJobs(this.root, ...params); }

  setDDP(...params) { return Job.setDDP(...params); }

  startJobServer(...params) { return Job.startJobServer(this.root, ...params); }
  shutdownJobServer(...params) { return Job.shutdownJobServer(this.root, ...params); }

  // These are deprecated and will be removed
  startJobs(...params) { return Job.startJobs(this.root, ...params); }
  stopJobs(...params) { return Job.stopJobs(this.root, ...params); }

  // Warning Stubs for server-only calls
  allow() { throw new Error("Server-only function jc.allow() invoked on client."); }
  deny() { throw new Error("Server-only function jc.deny() invoked on client."); }
  promote() { throw new Error("Server-only function jc.promote() invoked on client."); }
  setLogStream() { throw new Error("Server-only function jc.setLogStream() invoked on client."); }

  // Warning Stubs for client-only calls
  logConsole() { throw new Error("Client-only function jc.logConsole() invoked on server."); }

  _methodWrapper(method, func) {
    const toLog = this._toLog;
    const unblockDDPMethods = this._unblockDDPMethods != null ? this._unblockDDPMethods : false;
    // Return the wrapper function that the Meteor method will actually invoke
    return function(...params) {
      const user = this.userId != null ? this.userId : "[UNAUTHENTICATED]";
      toLog(user, method, `params: ${JSON.stringify(params)}`);
      if (unblockDDPMethods) { this.unblock(); }
      const retval = func(...params);
      toLog(user, method, `returned: ${JSON.stringify(retval)}`);
      return retval;
    };
  }

  _generateMethods() {
    const methodsOut = {};
    const methodPrefix = '_DDPMethod_';
    for (let [methodName, methodFunc] of _getAllProperties(this)) {
      if (methodName.slice(0, methodPrefix.length) === methodPrefix) {
        const baseMethodName = methodName.slice(methodPrefix.length);
        methodsOut[`${this.root}_${baseMethodName}`] = this._methodWrapper(baseMethodName, methodFunc.bind(this));
        }
    }
    return methodsOut;
  }

  async _idsOfDeps(ids, antecedents, dependents, jobStatuses) {
    // Cancel the entire tree of antecedents and/or dependents
    // Dependents: jobs that list one of the ids in their depends list
    // Antecedents: jobs with an id listed in the depends list of one of the jobs in ids
    const dependsQuery = [];
    const dependsIds = [];
    if (dependents) {
      dependsQuery.push({
        depends: {
          $elemMatch: {
            $in: ids
          }
        }
      });
    }
    if (antecedents) {
      const antsArray = [];
      await this.find(
        {
          _id: {
            $in: ids
          }
        },
        {
          fields: {
            depends: 1
          },
          transform: null
        }
      ).forEachAsync(function(d) {
        let i;
        if (!antsArray.includes(i)) {
          d.depends.forEach(d2 => {
            i = d2;
            antsArray.push(d2);
          });
        }
      });
      if (antsArray.length > 0) {
        dependsQuery.push({
          _id: {
            $in: antsArray
          }
        });
      }
    }
    if (dependsQuery.length > 0) {
      await this.find(
        {
          status: {
            $in: jobStatuses
          },
          $or: dependsQuery
        },
        {
          fields: {
            _id: 1
          },
          transform: null
        }
      ).forEachAsync(function(d) {
        if (!dependsIds.includes(d._id)) { return dependsIds.push(d._id); }
      });
    }
    return dependsIds;
  }

  async _rerun_job(doc, repeats = doc.repeats - 1, wait = doc.repeatWait, repeatUntil = doc.repeatUntil) {
    // Repeat? if so, make a new job from the old one
    let jobId, logObj;
    const id = doc._id;
    const { runId } = doc;
    const time = new Date();
    delete doc._id;
    delete doc.result;
    delete doc.failures;
    delete doc.expiresAfter;
    delete doc.workTimeout;
    doc.runId = null;
    doc.status = "waiting";
    doc.repeatRetries = (doc.repeatRetries != null) ? doc.repeatRetries : doc.retries + doc.retried;
    doc.retries = doc.repeatRetries;
    if (doc.retries > this.forever) { doc.retries = this.forever; }
    doc.retryUntil = repeatUntil;
    doc.retried = 0;
    doc.repeats = repeats;
    if (doc.repeats > this.forever) { doc.repeats = this.forever; }
    doc.repeatUntil = repeatUntil;
    doc.repeated = doc.repeated + 1;
    doc.updated = time;
    doc.created = time;
    doc.progress = {
      completed: 0,
      total: 1,
      percent: 0
    };
    if ((logObj = this._logMessage.rerun(id, runId))) {
      doc.log = [logObj];
    } else {
      doc.log = [];
    }

    doc.after = new Date(time.valueOf() + wait);
    if (jobId = await this.insertAsync(doc)) {
      await this._DDPMethod_jobReady(jobId);
      return jobId;
    } else {
      console.warn("Job rerun/repeat failed to reschedule!", id, runId);
    }
    return null;
  }

  async _checkDeps(job, dryRun = true) {
    let cancel = false;
    const resolved = [];
    const failed = [];
    const cancelled = [];
    const removed = [];
    const log = [];
    if (job.depends.length > 0) {
      const deps = await this.find({_id: { $in: job.depends }},{ fields: { _id: 1, runId: 1, status: 1 } }).fetchAsync();

      if (deps.length !== job.depends.length) {
        const foundIds = deps.map(d => d._id);
        for (let j of job.depends) {
          if (!(foundIds.includes(j))) {
            if (!dryRun) { await this._DDPMethod_jobLog(job._id, null, `Antecedent job ${j} missing at save`); }
            removed.push(j);
            }
        }
        cancel = true;
      }

      for (let depJob of deps) {
        if (!this.jobStatusCancellable.includes(depJob.status)) {
          switch (depJob.status) {
            case "completed":
              resolved.push(depJob._id);
              log.push(this._logMessage.resolved(depJob._id, depJob.runId));
              break;
            case "failed":
              cancel = true;
              failed.push(depJob._id);
              if (!dryRun) { await this._DDPMethod_jobLog(job._id, null, "Antecedent job failed before save"); }
              break;
            case "cancelled":
              cancel = true;
              cancelled.push(depJob._id);
              if (!dryRun) { await this._DDPMethod_jobLog(job._id, null, "Antecedent job cancelled before save"); }
              break;
            default:  // Unknown status
              throw new Meteor.Error("Unknown status in jobSave Dependency check");
          }
        }
      }

      if ((resolved.length !== 0) && !dryRun) {
        const mods = {
          $pull: {
            depends: {
              $in: resolved
            }
          },
          $push: {
            resolved: {
              $each: resolved
            },
            log: {
              $each: log
            }
          }
        };

        const n = await this.updateAsync(
          {
            _id: job._id,
            status: 'waiting'
          },
          mods
        );

        if (!n) {
          console.warn(`Update for job ${job._id} during dependency check failed.`);
        }
      }

      if (cancel && !dryRun) {
        await this._DDPMethod_jobCancel(job._id);
        return false;
      }
    }

    if (dryRun) {
      if (cancel || (resolved.length > 0)) {
        return {
          jobId: job._id,
          resolved,
          failed,
          cancelled,
          removed
        };
      } else {
        return false;
      }
    } else {
      return true;
    }
  }

  _DDPMethod_startJobServer(options) {
    check(options, Match.Optional({}));
    if (options == null) { options = {}; }
    // The client can't actually do this, so skip it
    if (!this.isSimulation) {
      if (this.stopped && (this.stopped !== true)) { Meteor.clearTimeout(this.stopped); }
      this.stopped = false;
    }
    return true;
  }

  _DDPMethod_shutdownJobServer(options) {
    check(options, Match.Optional({
      timeout: Match.Optional(Match.Where(_validIntGTEOne))})
    );
    if (options == null) { options = {}; }
    if (options.timeout == null) { options.timeout = 60*1000; }

    // The client can't actually do any of this, so skip it
    if (!this.isSimulation) {
      if (this.stopped && (this.stopped !== true)) { Meteor.clearTimeout(this.stopped); }
      this.stopped = Meteor.setTimeout(
        () => {
          const cursor = this.find(
            {
              status: 'running'
            },
            {
              transform: null
            }
          );
          const failedJobs = cursor.count();
          if (failedJobs !== 0) { console.warn(`Failing ${failedJobs} jobs on queue stop.`); }
          cursor.forEach(d => this._DDPMethod_jobFail(d._id, d.runId, "Running at Job Server shutdown."));
          if (this.logStream != null) { // Shutting down closes the logStream!
            this.logStream.end();
            return this.logStream = null;
          }
        },
        options.timeout
      );
    }
    return true;
  }

  async _DDPMethod_getJob(ids, options) {
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({
      getLog: Match.Optional(Boolean),
      getFailures: Match.Optional(Boolean)
    })
    );
    if (options == null) { options = {}; }
    if (options.getLog == null) { options.getLog = false; }
    if (options.getFailures == null) { options.getFailures = false; }
    let single = false;
    if (_validId(ids)) {
      ids = [ids];
      single = true;
    }
    if (ids.length === 0) { return null; }
    const fields = {_private:0};
    if (!options.getLog) { fields.log = 0; }
    if (!options.getFailures) { fields.failures = 0; }
    let docs = await this.find(
      {
        _id: {
          $in: ids
        }
      },
      {
        fields,
        transform: null
      }
    ).fetchAsync();
    if (docs != null ? docs.length : undefined) {
      if (this.scrub != null) {
        docs = docs.map(d => this.scrub(d));
      }
      check(docs, [_validJobDoc()]);
      if (single) {
        return docs[0];
      } else {
        return docs;
      }
    }
    return null;
  }

  async _DDPMethod_getWork(type, options) {
    let d;
    check(type, Match.OneOf(String, [ String ]));
    check(options, Match.Optional({
      maxJobs: Match.Optional(Match.Where(_validIntGTEOne)),
      workTimeout: Match.Optional(Match.Where(_validIntGTEOne))
    })
    );

    // Don't simulate getWork!
    if (this.isSimulation) {
      return;
    }

    if (options == null) { options = {}; }
    if (options.maxJobs == null) { options.maxJobs = 1; }
    // Don't put out any more jobs while shutting down
    if (this.stopped) {
      return [];
    }

    // Support string types or arrays of string types
    if (typeof type === 'string') {
      type = [ type ];
    }
    const time = new Date();
    let docs = [];
    const runId = this._makeNewID(); // This is meteor internal, but it will fail hard if it goes away.

    while (docs.length < options.maxJobs) {

      var logObj;
      const ids = await this.find(
        {
          type: {
            $in: type
          },
          status: 'ready',
          runId: null
        },
        {
          sort: {
            priority: 1,
            retryUntil: 1,
            after: 1
          },
          limit: options.maxJobs - docs.length, // never ask for more than is needed
          fields: {
            _id: 1
          },
          transform: null
        }).mapAsync(d => d._id);

        if (!((ids != null ? ids.length : undefined) > 0)) {
        break;  // Don't keep looping when there's no available work
      }

      const mods = {
        $set: {
          status: 'running',
          runId,
          updated: time
        },
        $inc: {
          retries: -1,
          retried: 1
        }
      };

      if (logObj = this._logMessage.running(runId)) {
        mods.$push =
          {log: logObj};
      }

      if (options.workTimeout != null) {
        mods.$set.workTimeout = options.workTimeout;
        mods.$set.expiresAfter = new Date(time.valueOf() + options.workTimeout);
      } else {
        if (mods.$unset == null) { mods.$unset = {}; }
        mods.$unset.workTimeout = "";
        mods.$unset.expiresAfter = "";
      }

      const num = await this.updateAsync(
        {
          _id: {
            $in: ids
          },
          status: 'ready',
          runId: null
        },
        mods,
        {
          multi: true
        }
      );

      if (num > 0) {
        var foundDocs = await this.find(
          {
            _id: {
              $in: ids
            },
            runId
          },
          {
            fields: {
              log: 0,
              failures: 0,
              _private: 0
            },
            transform: null
          }
        ).fetchAsync();

        if ((foundDocs != null ? foundDocs.length : undefined) > 0) {
          if (this.scrub != null) {
            foundDocs = foundDocs.map(d => this.scrub(d));
          }
          check(docs, [ _validJobDoc() ]);
          docs = docs.concat(foundDocs);
        }
      }
    }
    // else
    //   console.warn "getWork: find after update failed"
    return docs;
  }

  async _DDPMethod_jobRemove(ids, options) {
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({}));
    if (options == null) { options = {}; }
    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) { return false; }
    const num = await this.removeAsync(
      {
        _id: {
          $in: ids
        },
        status: {
          $in: this.jobStatusRemovable
        }
      }
    );
    if (num > 0) {
      return true;
    } else {
      console.warn("jobRemove failed");
    }
    return false;
  }

  async _DDPMethod_jobPause(ids, options) {
    let logObj;
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({}));
    if (options == null) { options = {}; }
    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) { return false; }
    const time = new Date();

    const mods = {
      $set: {
        status: "paused",
        updated: time
      }
    };

    if (logObj = this._logMessage.paused()) {
      mods.$push =
        {log: logObj};
    }

    const num = await this.updateAsync(
      {
        _id: {
          $in: ids
        },
        status: {
          $in: this.jobStatusPausable
        }
      },
      mods,
      {
        multi: true
      }
    );
    if (num > 0) {
      return true;
    } else {
      console.warn("jobPause failed");
    }
    return false;
  }

  async _DDPMethod_jobResume(ids, options) {
    let logObj;
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({}));
    if (options == null) { options = {}; }
    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) { return false; }
    const time = new Date();
    const mods = {
      $set: {
        status: "waiting",
        updated: time
      }
    };

    if (logObj = this._logMessage.resumed()) {
      mods.$push =
        {log: logObj};
    }

    const num = await this.updateAsync(
      {
        _id: {
          $in: ids
        },
        status: "paused",
        updated: {
          $ne: time
        }
      },
      mods,
      {
        multi: true
      }
    );
    if (num > 0) {
      await this._DDPMethod_jobReady(ids);
      return true;
    } else {
      console.warn("jobResume failed");
    }
    return false;
  }

  async _DDPMethod_jobReady(ids, options) {
    let l;
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({
      force: Match.Optional(Boolean),
      time: Match.Optional(Date)
    })
    );

    // Don't simulate jobReady. It has a strong chance of causing issues with
    // Meteor on the client, particularly if an observeChanges() is triggering
    // a processJobs queue (which in turn sets timers.)
    if (this.isSimulation) {
      return;
    }

    const now = new Date();

    if (options == null) { options = {}; }
    if (options.force == null) { options.force = false; }
    if (options.time == null) { options.time = now; }

    if (_validId(ids)) {
      ids = [ids];
    }

    const query = {
      status: "waiting",
      after: {
        $lte: options.time
      }
    };

    const mods = {
      $set: {
        status: "ready",
        updated: now
      }
    };

    if (ids.length > 0) {
      query._id =
        {$in: ids};
      mods.$set.after = now;
    }

    const logObj = [];

    if (options.force) {
      mods.$set.depends = [];  // Don't move to resolved, because they weren't!
      l = this._logMessage.forced();
      if (l) { logObj.push(l); }
    } else {
      query.depends =
        {$size: 0};
    }

    l = this._logMessage.readied();
    if (l) { logObj.push(l); }

    if (logObj.length > 0) {
      mods.$push = {
        log: {
          $each: logObj
        }
      };
    }

    const num = await this.updateAsync(
      query,
      mods,
      {
        multi: true
      }
    );

    if (num > 0) {
      return true;
    } else {
      return false;
    }
  }

  async _DDPMethod_jobCancel(ids, options) {
    let logObj;
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({
      antecedents: Match.Optional(Boolean),
      dependents: Match.Optional(Boolean)
    })
    );
    if (options == null) { options = {}; }
    if (options.antecedents == null) { options.antecedents = false; }
    if (options.dependents == null) { options.dependents = true; }
    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) { return false; }
    const time = new Date();

    const mods = {
      $set: {
        status: "cancelled",
        runId: null,
        progress: {
          completed: 0,
          total: 1,
          percent: 0
        },
        updated: time
      }
    };

    if (logObj = this._logMessage.cancelled()) {
      mods.$push =
        {log: logObj};
    }

    const num = await this.updateAsync(
      {
        _id: {
          $in: ids
        },
        status: {
          $in: this.jobStatusCancellable
        }
      },
      mods,
      {
        multi: true
      }
    );
    // Cancel the entire tree of dependents
    const cancelIds = await this._idsOfDeps(ids, options.antecedents, options.dependents, this.jobStatusCancellable);

    let depsCancelled = false;
    if (cancelIds.length > 0) {
      depsCancelled = await this._DDPMethod_jobCancel(cancelIds, options);
    }

    if ((num > 0) || depsCancelled) {
      return true;
    } else {
      console.warn("jobCancel failed");
    }
    return false;
  }

  async _DDPMethod_jobRestart(ids, options) {
    let logObj;
    check(ids, Match.OneOf(Match.Where(_validId), [ Match.Where(_validId) ]));
    check(options, Match.Optional({
      retries: Match.Optional(Match.Where(_validIntGTEZero)),
      until: Match.Optional(Date),
      antecedents: Match.Optional(Boolean),
      dependents: Match.Optional(Boolean)
    })
    );
    if (options == null) { options = {}; }
    if (options.retries == null) { options.retries = 1; }
    if (options.retries > this.forever) { options.retries = this.forever; }
    if (options.dependents == null) { options.dependents = false; }
    if (options.antecedents == null) { options.antecedents = true; }
    if (_validId(ids)) {
      ids = [ids];
    }
    if (ids.length === 0) { return false; }
    const time = new Date();

    const query = {
      _id: {
        $in: ids
      },
      status: {
        $in: this.jobStatusRestartable
      }
    };

    const mods = {
      $set: {
        status: "waiting",
        progress: {
          completed: 0,
          total: 1,
          percent: 0
        },
        updated: time
      },
      $inc: {
        retries: options.retries
      }
    };

    if (logObj = this._logMessage.restarted()) {
      mods.$push =
        {log: logObj};
    }

    if (options.until != null) {
      mods.$set.retryUntil = options.until;
    }

    const num = await this.updateAsync(query, mods, {multi: true});

    // Restart the entire tree of dependents
    const restartIds = await this._idsOfDeps(ids, options.antecedents, options.dependents, this.jobStatusRestartable);

    let depsRestarted = false;
    if (restartIds.length > 0) {
      depsRestarted = await this._DDPMethod_jobRestart(restartIds, options);
    }

    if ((num > 0) || depsRestarted) {
      await this._DDPMethod_jobReady(ids);
      return true;
    } else {
      console.warn("jobRestart failed");
    }
    return false;
  }

  // Job creator methods

  async _DDPMethod_jobSave(doc, options) {
    check(doc, _validJobDoc());
    check(options, Match.Optional({
      cancelRepeats: Match.Optional(Boolean)})
    );
    check(doc.status, Match.Where(v => Match.test(v, String) && [ 'waiting', 'paused' ].includes(v)));
    if (options == null) { options = {}; }
    if (options.cancelRepeats == null) { options.cancelRepeats = false; }
    if (doc.repeats > this.forever) { doc.repeats = this.forever; }
    if (doc.retries > this.forever) { doc.retries = this.forever; }

    const time = new Date();

      // This enables the default case of "run immediately" to
      // not be impacted by a client's clock
    if (doc.after < time) { doc.after = time; }
    if (doc.retryUntil < time) { doc.retryUntil = time; }
    if (doc.repeatUntil < time) { doc.repeatUntil = time; }

    // If doc.repeatWait is a later.js object, then don't run before
    // the first valid scheduled time that occurs after doc.after
    if ((this.later != null) && (typeof doc.repeatWait !== 'number')) {
      // Using a workaround to find next time after doc.after.
      // See: https://github.com/vsivsi/meteor-job-collection/issues/217
      let next;
      const schedule = this.later != null ? this.later.schedule(doc.repeatWait) : undefined;
      if (!schedule || !(next = schedule.next(2, schedule.prev(1, doc.after))[1])) {
        console.warn(`No valid available later.js times in schedule after ${doc.after}`);
        return null;
      }
      const nextDate = new Date(next);
      if (!(nextDate <= doc.repeatUntil)) {
        console.warn(`No valid available later.js times in schedule before ${doc.repeatUntil}`);
        return null;
      }
      doc.after = nextDate;
    } else if ((this.later == null) && (typeof doc.repeatWait !== 'number')) {
      console.warn("Later.js not loaded...");
      return null;
    }

    if (doc._id) {

      let logObj;
      const mods = {
        $set: {
          status: 'waiting',
          data: doc.data,
          retries: doc.retries,
          repeatRetries: (doc.repeatRetries != null) ? doc.repeatRetries : doc.retries + doc.retried,
          retryUntil: doc.retryUntil,
          retryWait: doc.retryWait,
          retryBackoff: doc.retryBackoff,
          repeats: doc.repeats,
          repeatUntil: doc.repeatUntil,
          repeatWait: doc.repeatWait,
          depends: doc.depends,
          priority: doc.priority,
          after: doc.after,
          updated: time
        }
      };

      if (logObj = this._logMessage.resubmitted()) {
        mods.$push =
          {log: logObj};
      }

      const num = await this.updateAsync(
        {
          _id: doc._id,
          status: 'paused',
          runId: null
        },
        mods
      );

      if (num && await this._checkDeps(doc, false)) {
        await this._DDPMethod_jobReady(doc._id);
        return doc._id;
      } else {
        return null;
      }
    } else {
      if ((doc.repeats === this.forever) && options.cancelRepeats) {
        // If this is unlimited repeating job, then cancel any existing jobs of the same type
        this.find(
          {
            type: doc.type,
            status: {
              $in: this.jobStatusCancellable
            }
          },
          {
            transform: null
          }
        ).forEach(d => this._DDPMethod_jobCancel(d._id, {}));
      }
      doc.created = time;
      doc.log.push(this._logMessage.submitted());
      doc._id = await this.insertAsync(doc);
      if (doc._id && await this._checkDeps(doc, false)) {
        await this._DDPMethod_jobReady(doc._id);
        return doc._id;
      } else {
        return null;
      }
    }
  }

  // Worker methods

  async _DDPMethod_jobProgress(id, runId, completed, total, options) {
    check(id, Match.Where(_validId));
    check(runId, Match.Where(_validId));
    check(completed, Match.Where(_validNumGTEZero));
    check(total, Match.Where(_validNumGTZero));
    check(options, Match.Optional({}));
    if (options == null) { options = {}; }

    // Notify the worker to stop running if we are shutting down
    if (this.stopped) {
      return null;
    }

    const progress = {
      completed,
      total,
      percent: (100*completed)/total
    };

    check(progress, Match.Where(v => (v.total >= v.completed) && (0 <= v.percent && v.percent <= 100))
    );

    const time = new Date();

    const job = await this.findOneAsync({ _id: id }, { fields: { workTimeout: 1 } });

    const mods = {
      $set: {
        progress,
        updated: time
      }
    };

    if ((job != null ? job.workTimeout : undefined) != null) {
      mods.$set.expiresAfter = new Date(time.valueOf() + job.workTimeout);
    }

    const num = await this.updateAsync(
      {
        _id: id,
        runId,
        status: "running"
      },
      mods
    );

    if (num === 1) {
      return true;
    } else {
      console.warn("jobProgress failed");
    }
    return false;
  }

  async _DDPMethod_jobLog(id, runId, message, options) {
    check(id, Match.Where(_validId));
    check(runId, Match.OneOf(Match.Where(_validId), null));
    check(message, String);
    check(options, Match.Optional({
      level: Match.Optional(Match.Where(_validLogLevel)),
      data: Match.Optional(Object)
    })
    );
    if (options == null) { options = {}; }
    const time = new Date();
    const logObj = {
      time,
      runId,
      level: options.level != null ? options.level : 'info',
      message
    };
    if (options.data != null) { logObj.data = options.data; }

    const job = await this.findOneAsync({ _id: id }, { fields: { status: 1, workTimeout: 1 } });

    const mods = {
      $push: {
        log: logObj
      },
      $set: {
        updated: time
      }
    };

    if (((job != null ? job.workTimeout : undefined) != null) && (job.status === 'running')) {
      mods.$set.expiresAfter = new Date(time.valueOf() + job.workTimeout);
    }

    const num = await this.updateAsync(
      {
        _id: id
      },
      mods
    );
    if (num === 1) {
      return true;
    } else {
      console.warn("jobLog failed");
    }
    return false;
  }

  async _DDPMethod_jobRerun(id, options) {
    check(id, Match.Where(_validId));
    check(options, Match.Optional({
      repeats: Match.Optional(Match.Where(_validIntGTEZero)),
      until: Match.Optional(Date),
      wait: Match.OneOf(Match.Where(_validIntGTEZero), Match.Where(_validLaterJSObj))
    })
    );

    const doc = await this.findOneAsync(
      {
        _id: id,
        status: "completed"
      },
      {
        fields: {
          result: 0,
          failures: 0,
          log: 0,
          progress: 0,
          updated: 0,
          after: 0,
          status: 0
        },
        transform: null
      }
    );

    if (doc != null) {
      if (options == null) { options = {}; }
      if (options.repeats == null) { options.repeats = 0; }
      if (options.repeats > this.forever) { options.repeats = this.forever; }
      if (options.until == null) { options.until = doc.repeatUntil; }
      if (options.wait == null) { options.wait = 0; }
      return await this._rerun_job(doc, options.repeats, options.wait, options.until);
    }

    return false;
  }

  async _DDPMethod_jobDone(id, runId, result, options) {
    let logObj;
    check(id, Match.Where(_validId));
    check(runId, Match.Where(_validId));
    check(result, Object);
    check(options, Match.Optional({
      repeatId: Match.Optional(Boolean),
      delayDeps: Match.Optional(Match.Where(_validIntGTEZero))
    })
    );

    if (options == null) { options = { repeatId: false }; }
    const time = new Date();
    const doc = await this.findOneAsync(
      {
        _id: id,
        runId,
        status: "running"
      },
      {
        fields: {
          log: 0,
          failures: 0,
          updated: 0,
          after: 0,
          status: 0
        },
        transform: null
      }
    );
    if (doc == null) {
      if (!this.isSimulation) {
        console.warn("Running job not found", id, runId);
      }
      return false;
    }

    let mods = {
      $set: {
        status: "completed",
        result,
        progress: {
          completed: doc.progress.total || 1,
          total: doc.progress.total || 1,
          percent: 100
        },
        updated: time
      }
    };

    if (logObj = this._logMessage.completed(runId)) {
      mods.$push =
        {log: logObj};
    }

    const num = await this.updateAsync(
      {
        _id: id,
        runId,
        status: "running"
      },
      mods
    );
    if (num === 1) {
      let jobId;
      if (doc.repeats > 0) {
        if (typeof doc.repeatWait === 'number') {
          if ((doc.repeatUntil - doc.repeatWait) >= time) {
            jobId = this._rerun_job(doc);
          }
        } else {
          // This code prevents a job that just ran and finished
          // instantly from being immediately rerun on the same occurance
          const next = this.later != null ? this.later.schedule(doc.repeatWait).next(2) : undefined;
          if (next && (next.length > 0)) {
            let d = new Date(next[0]);
            if (((d - time) > 500) || (next.length > 1)) {
              if ((d - time) <= 500) {
                d = new Date(next[1]);
              }
              const wait = d - time;
              if ((doc.repeatUntil - wait) >= time) {
                jobId = this._rerun_job(doc, doc.repeats - 1, wait);
              }
            }
          }
        }
      }

      // Resolve depends
      const ids = (await this.find(
        {
          depends: {
            $all: [ id ]
          }
        },
        {
          transform: null,
          fields: {
            _id: 1
          }
        }
      ).fetchAsync()).map(d => d._id);

      if (ids.length > 0) {

        mods = {
          $pull: {
            depends: id
          },
          $push: {
            resolved: id
          }
        };

        if (options.delayDeps != null) {
          const after = new Date(time.valueOf() + options.delayDeps);
          mods.$max =
            {after};
        }

        if (logObj = this._logMessage.resolved(id, runId)) {
          mods.$push.log = logObj;
        }

        const n = await this.updateAsync(
          {
            _id: {
              $in: ids
            }
          },
          mods,
          {
            multi: true
          }
        );
        if (n !== ids.length) {
          console.warn(`Not all dependent jobs were resolved ${ids.length} > ${n}`);
        }
        // Try to promote any jobs that just had a dependency resolved
        await this._DDPMethod_jobReady(ids);
      }
      if (options.repeatId && (jobId != null)) {
        return jobId;
      } else {
        return true;
      }
    } else {
      console.warn("jobDone failed");
    }
    return false;
  }

  async _DDPMethod_jobFail(id, runId, err, options) {
    let logObj;
    check(id, Match.Where(_validId));
    check(runId, Match.Where(_validId));
    check(err, Object);
    check(options, Match.Optional({
      fatal: Match.Optional(Boolean)})
    );

    if (options == null) { options = {}; }
    if (options.fatal == null) { options.fatal = false; }

    const time = new Date();
    const doc = await this.findOneAsync(
      {
        _id: id,
        runId,
        status: "running"
      },
      {
        fields: {
          log: 0,
          failures: 0,
          progress: 0,
          updated: 0,
          after: 0,
          runId: 0,
          status: 0
        },
        transform: null
      }
    );
    if (doc == null) {
      if (!this.isSimulation) {
        console.warn("Running job not found", id, runId);
      }
      return false;
    }

    const after = (() => { switch (doc.retryBackoff) {
        case 'exponential':
          return new Date(time.valueOf() + (doc.retryWait*Math.pow(2, doc.retried-1)));
        default:
          return new Date(time.valueOf() + doc.retryWait);  // 'constant'
      } })();

      const newStatus = (!options.fatal &&
                        (doc.retries > 0) &&
                        (doc.retryUntil >= after)) ? "waiting" : "failed";

    err.runId = runId;  // Link each failure to the run that generated it.

    const mods = {
      $set: {
        status: newStatus,
        runId: null,
        after,
        updated: time
      },
      $push: {
        failures:
          err
      }
    };

    if (logObj = this._logMessage.failed(runId, newStatus === 'failed', err)) {
      mods.$push.log = logObj;
    }

    const num = await this.updateAsync(
      {
        _id: id,
        runId,
        status: "running"
      },
      mods
    );
    if ((newStatus === "failed") && (num === 1)) {
      // Cancel any dependent jobs too
      this.find(
        {
          depends: {
            $all: [ id ]
          }
        },
        {
          transform: null
        }
      ).forEach(d => this._DDPMethod_jobCancel(d._id));
    }
    if (num === 1) {
      return true;
    } else {
      console.warn("jobFail failed");
    }
    return false;
  }
}
JobCollectionBase.initClass();

export default JobCollectionBase;
