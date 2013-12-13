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

function error(){
  return function(resume){
    setImmediate(function(){
      resume(new Error('test error'));
    });
  }
}

module.exports = {
  'sync(fn)': {
    "if fn isn't a generator": {
      'it should throw error': function(){
        expect(function(){
          sync(1)
        }).to.throw(Error);
      }
    },
    'if fn is node-style function': {
      'it should wrap it': function(done){
        var sleep = sync(function(time, callback){
          setTimeout(function(){
            callback(null, time)
          }, time);
        });
        sync(function*(){
          var slept = yield* sleep(10);
          expect(slept).to.be.equal(10);
          done();
        });
      }
      // TODO: test context
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
          var one = yield echo(1);
          var two = yield echo(2);
          expect(one+two).to.be.equal(3);
          done();
        });
      }
    },
    //TODO: multiple return values
    'if async fn returns one value': {
      'it should be passed to the yielding point': function(done){
        sync(function*(){
          var one = yield echo(1);
          expect(one).to.be.equal(1);
          done();
        })
      }
    },
    'if async fn returns error': {
      'it should be thrown at the yielding point': function(done){
        sync(function*(){
          try {
            yield error();
          } catch (e) {
            expect(e.message).to.eql('test error');
            done();
          }
        })
      }
    },
    "if generator didn't catch error": {
      'it should be passed to sync callback': function(done){
        sync(function*(){
          yield error();
        })(function(e){
          expect(e.message).to.eql('test error');
          done();
        })
      }
    }
  }
};