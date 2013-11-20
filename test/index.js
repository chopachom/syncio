var expect = require('chai').expect;
var sync = require('../index');

function sleep(time){
  return function(resume){
    setTimeout(function(){
      resume(null);
    }, time);
  }
}

function echo(value){
  return function(resume){
    setImmediate(function(){
      resume(null, value);
    });
  }
}

module.exports = {
  'sync(fn)': {
    "it should throw error if fn isn't a generator": function(){
      expect(function(){
        sync(function(){})
      }).to.throw(Error);
    },
    'generator yields once': {
      'it should work': function(done){
        sync(function*(){
          yield sleep(10);
          done();
        });
      }
    },
    'generator yields several times': {
      'it should work': function(done){
        sync(function*(){
          yield sleep(10);
          yield sleep(10);
          done();
        });
      }
    },
    'if async fn return one value': {
      'it should be passed to the yielding point': function(){
        sync(function*(){
          var one = yield echo(1);
          expect(one).to.be.equal(1);
        })
      }
    }
  }
};