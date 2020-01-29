/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
  //###########################################################################
  //     Copyright (C) 2014-2017 by Vaughn Iverson
  //     job-collection is free software released under the MIT/X11 license.
  //     See included LICENSE file for details.
  //###########################################################################
let JobCollection;

import Job from '../job/src/job_class';
import JobCollectionBase from './shared';

if (Meteor.isServer) {

  const eventEmitter = Npm.require('events').EventEmitter;

  const userHelper = function(user, connection) {
    let ret = user != null ? user : "[UNAUTHENTICATED]";
    if (!connection) {
      ret = "[SERVER]";
    }
    return ret;
  };

  //###############################################################
  //# job-collection server class

  JobCollection = class JobCollection extends JobCollectionBase {
    constructor(root = 'queue', options = {}) {
      var i, len, level, ref;
      super(root, options);
      this._onError = this._onError.bind(this);
      this._onCall = this._onCall.bind(this);
      this._toLog = this._toLog.bind(this);
      // process.stdout.write "#{new Date()}, #{userId}, #{method}, #{message}\n"
      this._emit = this._emit.bind(this);

      this.events = new eventEmitter();

      this._errorListener = this.events.on('error', this._onError);

      // Add events for all individual successful DDP methods
      this._methodErrorDispatch = this.events.on('error', msg => {
        return this.events.emit(msg.method, msg);
      });

      this._callListener = this.events.on('call', this._onCall);

      // Add events for all individual successful DDP methods
      this._methodEventDispatch = this.events.on('call', msg => {
        return this.events.emit(msg.method, msg);
      });

      this.stopped = true;

      // No client mutators allowed
      Meteor.Collection.prototype.deny.bind(this)({
        update: () => true,
        insert: () => true,
        remove: () => true
      });

      this.promote();

      this.logStream = null;

      this.allows = {};
      this.denys = {};

      // Initialize allow/deny lists for permission levels and ddp methods
      for (let level of this.ddpPermissionLevels.concat(this.ddpMethods)) {
        this.allows[level] = [];
        this.denys[level] = [];
      }

      // If a connection option is given, then this JobCollection is actually hosted
      // remotely, so don't establish local and remotely callable server methods in that case
      if (options.connection == null) {
        // Default indexes, only when not remotely connected!
        this._ensureIndex({ type : 1, status : 1 });
        this._ensureIndex({ priority : 1, retryUntil : 1, after : 1 });
        this._ensureIndex({ depends : 1 });
        this.isSimulation = false;
        const localMethods = this._generateMethods();
        if (this._localServerMethods == null) { this._localServerMethods = {}; }
        for (let methodName in localMethods) { const methodFunction = localMethods[methodName]; this._localServerMethods[methodName] = methodFunction; }
        const foo = this;
        this._ddp_apply = (name, params, cb) => {
          if (cb != null) {
            return Meteor.setTimeout((() => {
              let err = null;
              let res = null;
              try {
                res = this._localServerMethods[name].apply(this, params);
              } catch (e) {
                err = e;
              }
              return cb(err, res);
            }), 0);
          } else {
            return this._localServerMethods[name].apply(this, params);
          }
        };

        Job._setDDPApply(this._ddp_apply, root);

        Meteor.methods(localMethods);
      }
    }

    _onError(msg) {
      if (!(this instanceof JobCollection)) {
        throw new Error('Bound instance method accessed before binding');
      }
      const user = userHelper(msg.userId, msg.connection);
      return this._toLog(user, msg.method, `${msg.error}`);
    }

    _onCall(msg) {
      if (!(this instanceof JobCollection)) {
        throw new Error('Bound instance method accessed before binding');
      }
      const user = userHelper(msg.userId, msg.connection);
      this._toLog(user, msg.method, `params: ${JSON.stringify(msg.params)}`);
      return this._toLog(user, msg.method, `returned: ${JSON.stringify(msg.returnVal)}`);
    }

    _toLog(userId, method, message) {
      if (!(this instanceof JobCollection)) {
        throw new Error('Bound instance method accessed before binding');
      }
      return (this.logStream != null ? this.logStream.write(`${new Date()}, ${userId}, ${method}, ${message}\n`) : undefined);
    }

    _emit(method, connection, userId, err, ret, ...params) {
      if (!(this instanceof JobCollection)) {
        throw new Error('Bound instance method accessed before binding');
      }
      if (err) {
        return this.events.emit('error', {
          error: err,
          method,
          connection,
          userId,
          params,
          returnVal: null
        }
        );
      } else {
        return this.events.emit('call', {
          error: null,
          method,
          connection,
          userId,
          params,
          returnVal: ret
        }
        );
      }
    }

    _methodWrapper(method, func) {
      const self = this;
      const myTypeof = function(val) {
        let type = typeof val;
        if ((type === 'object') && type instanceof Array) { type = 'array'; }
        return type;
      };
      const permitted = (userId, params) => {
        const performTest = tests => {
          let result = false;
          for (var test of tests) {
            if (result === false) {
              result = result || (() => {
                switch (myTypeof(test)) {
                  case 'array': return test.includes(userId);
                  case 'function': return test(userId, method, params);
                  default: return false;
                }
              })();
            }
          }
          return result;
        };
        const performAllTests = allTests => {
          let result = false;
          for (let t of this.ddpMethodPermissions[method]) {
            if (result === false) {
              result = result || performTest(allTests[t]);
            }
          }
          return result;
        };
        return !performAllTests(this.denys) && performAllTests(this.allows);
      };
      // Return the wrapper function that the Meteor method will actually invoke
      return function(...params) {
        let err, retval;
        try {
          if (!this.connection || !!permitted(this.userId, params)) {
            retval = func(...params);
          } else {
            err = new Meteor.Error(403, "Method not authorized", "Authenticated user is not permitted to invoke this method.");
            throw err;
          }
        } catch (error) {
          err = error;
          self._emit(method, this.connection, this.userId, err);
          throw err;
        }
        self._emit(method, this.connection, this.userId, null, retval, ...params);
        return retval;
      };
    }

    setLogStream(writeStream = null) {
      if (this.logStream) {
        throw new Error("logStream may only be set once per job-collection startup/shutdown cycle");
      }
      this.logStream = writeStream;
      if (!(this.logStream == null) &&
              ((this.logStream.write == null) ||
              (typeof this.logStream.write !== 'function') ||
              (this.logStream.end == null) ||
              (typeof this.logStream.end !== 'function'))) {
        throw new Error("logStream must be a valid writable node.js Stream");
      }
    }

    // Register application allow rules
    allow(allowOptions) {
      const result = [];
      for (let type in allowOptions) {
        const func = allowOptions[type];
        if (type in this.allows) {
          result.push(this.allows[type].push(func));
        }
      }
      return result;
    }

    // Register application deny rules
    deny(denyOptions) {
      const result = [];
      for (let type in denyOptions) {
        const func = denyOptions[type];
        if (type in this.denys) {
          result.push(this.denys[type].push(func));
        }
      }
      return result;
    }

    // Hook function to sanitize documents before validating them in getWork() and getJob()
    scrub(job) {
      return job;
    }

    promote(milliseconds = 15 * 1000) {
      if ((typeof milliseconds === 'number') && (milliseconds > 0)) {
        if (this.interval) {
          Meteor.clearInterval(this.interval);
        }
        this._promote_jobs();
        return this.interval = Meteor.setInterval(this._promote_jobs.bind(this), milliseconds);
      } else {
        return console.warn(`jobCollection.promote: invalid timeout: ${this.root}, ${milliseconds}`);
      }
    }

    _promote_jobs(ids = []) {
      if (this.stopped) {
        return;
      }
      // This looks for zombie running jobs and autofails them
      this.find({status: 'running', expiresAfter: { $lt: new Date() }})
        .forEach(job => {
        return new Job(this.root, job).fail("Failed for exceeding worker set workTimeout");
      });
      // Change jobs from waiting to ready when their time has come
      // and dependencies have been satisfied
      return this.readyJobs();
    }
  }
}

export { Job, JobCollection };
