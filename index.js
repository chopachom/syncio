module.exports = function sync(generator){
  if(!isGeneratorFunction(generator)){
    throw new Error('Not a generator function');
  }
  function resume(res){
    var result = iterator.next(res);
    if(typeof result.value === 'function'){
      result.value(resume);
    }
  }
  var iterator = generator();
  var continuator = iterator.next().value;
  continuator(resume);
};

function isGeneratorFunction(obj) {
  return obj && obj.constructor && obj.constructor.name === 'GeneratorFunction';
}
