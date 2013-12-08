module.exports = function sync (generator) {
  if (!isGeneratorFunction(generator)) {
    throw new Error('Not a generator function');
  }

  function resume (err, res) {
    if (err) {
      // calling throw will throw error if generator don't catch it
      try {
        iterator.throw(err);
      } catch (e) {
        if(done) done(err);
      }
      return
    }
    var result = iterator.next(res);
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
  var iterator = generator();

  resume(null);

  return function (fn) {
    done = fn;
  }
};

function isGeneratorFunction (obj) {
  return obj && obj.constructor && obj.constructor.name === 'GeneratorFunction';
}
