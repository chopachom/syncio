module.exports = function sync (fn) {
  if(isPlainFunction(fn)){
    return denodeify(fn, arguments[1]);
  }
  if (!isGeneratorFunction(fn)) {
    throw new Error('Not a generator function');
  }

  function resume (err, res) {
    if (err) {
      // calling throw will throw error if generator don't catch it
      try {
        generator.throw(err);
      } catch (e) {
        if(done) done(err);
      }
      return
    }
    var result = generator.next(res);
    if (result.done && done) {
      return done(null, result.value);
    }
    // if generator yielded async function
    if (typeof result.value === 'function') {
      // pass resume fn so that it will wake up the generator when
      // async function will finish
      result.value(resume);
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

function denodeify(fn, ctx){
  return function*(){
    var args = Array.prototype.slice.call(arguments, 0);
    return yield function(resume){
      args.push(resume);
      fn.apply(ctx, args);
    }
  }
}