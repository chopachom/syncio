var slice = Array.prototype.slice;

module.exports = function sync (fn) {
  if(isPlainFunction(fn)){
    return denodeify(fn, arguments[1]);
  }
  if(isPromise(fn)){
    return depromisify(fn);
  }
  if (!isGeneratorFunction(fn)) {
    throw new Error('Not a generator function');
  }

  function resume () {
    try {
      var result = nextOrError(generator, arguments);
    } catch (e) {
      if (done) return done(e);
      else throw e
    }
    if (result.done) {
      if (done) done(null, result.value);
      return;
    }
    // if generator yielded async function
    if (typeof result.value === 'function') {
      // pass resume fn so that it will wake up the generator when
      // async function will finish
      result.value(resume);
      return;
    }
    throw new Error('Generator must yield async function that accepts one argument - the callback');
  }

  var done;
  var generator = fn();

  resume(null);

  return function (fn) {
    done = fn;
  }
};

// TODO: document this function
module.exports.join = function* join (generators) {
  var results = [generators.length];
  var interim = [generators.length];
  while (truthy(generators) > 0) {
    // get all the continuations from the generators
    var continuations = generators.map(function (g, i) {
      if (!g) return;
      var res = nextOrError(g, interim[i]);
      if (res.done) {
        results[i] = res.value;
        return
      }
      return res.value
    });
    // remove exhausted generators
    continuations.forEach(function (c, i) {
      if (!c) generators[i] = null
    });
    // if we don't have continuation for the respective generator
    // substitute it with no-op function, this is happening when generator is exhausted
    continuations = continuations.map(function (c) {
      return c || noop;
    });
    interim = yield function (resume) {
      parallel(continuations, function (results) {
        resume(null, results);
      });
    }
  }
  return results
};

function nextOrError (generator, arguments) {
  arguments || (arguments = []);
  var err = arguments[0];
  if (err) {
    // calling throw will throw error if generator don't catch it
    return generator.throw(err);
  }
  var args = slice.call(arguments, 1);
  // if we received one argument then just pass it as is
  if (args.length === 1) {
    args = args[0];
  }
  return generator.next(args);
}

function parallel (fns, cb) {
  var i = fns.length;
  var results = [];

  fns.forEach(function (fn, index) {
    fn(function () {
      results[index] = slice.call(arguments, 0);
      --i || cb(results);
    });
  });
}

//function isGenerator(obj) {
//  return obj && 'function' == typeof obj.next && 'function' == typeof obj.throw;
//}

function isGeneratorFunction (obj) {
  return obj && obj.constructor && obj.constructor.name === 'GeneratorFunction';
}

function isPlainFunction(obj){
  return typeof obj === 'function' && !isGeneratorFunction(obj);
}

function isPromise(obj) {
  return obj && typeof obj.then === 'function';
}

function denodeify(fn, ctx){
  return function*(){
    var args = Array.prototype.slice.call(arguments, 0);
    return yield function(resume){
      args.push(resume);
      // TODO: can be optimized for small number of args
      fn.apply(ctx, args);
    }
  }
}

function* depromisify(promise){
  return yield function(resume){
    promise.then(function(){
      var args = slice.call(arguments,0);
      args.unshift(null);
      resume.apply(null, args);
    }, function(err){
      resume(err);
    })
  }
}

function truthy (array) {
  var count = 0;
  for (var i = 0; i < array.length; i++) {
    if (array[i]) count++;
  }
  return count
}

function noop (cb) {
  cb()
}