module.exports = function sync(generator){
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
