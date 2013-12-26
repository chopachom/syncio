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

  function resume (err) {
    if (err) {
      // calling throw will throw error if generator don't catch it
      try {
        generator.throw(err);
      } catch (e) {
        if(done) done(err);
      }
      return
    }
    var args, result;
    args = slice.call(arguments, 1);
    // if we received one argument then just pass it as is
    if(args.length === 1){
      args = args[0];
    }
    result = generator.next(args);
    if (result.done) {
      if (done) done(null, result.value);
      return;
    }
    // if generator yielded async function
    if (typeof result.value === 'function') {
      // pass resume fn so that it will wake up the generator when
      // async function will finish
      result.value(resume);
    } else {
      console.log(result);
      throw new Error('Generator must yield async function that accepts one argument - the callback');
    }
  }

  var done;
  var generator = fn();

  resume(null);

  return function (fn) {
    done = fn;
  }
};

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

// TODO:
// - parallel execution