var expect = require('chai').expect;
var sync = require('../index');
var Promise = require('bluebird');

function sleep(time){
  return function(resume){
    setTimeout(function(){
      resume(null);
    }, time);
  }
}

function echo(){
  var args = Array.prototype.slice.call(arguments, 0);
  return function(resume){
    setImmediate(function(){
      args.unshift(null);
      resume.apply(null, args);
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
    'if fn is a promise': {
      'it should wrap it': function(done){
        var promisified = Promise.promisify(function(time, callback){
          setTimeout(function(){
            callback(null, time);
          }, time);
        });
        sync(function*(){
          var res = yield* sync(promisified(10));
          expect(res).to.be.equal(10);
          done();
        });
      },
      'it should throw error if promise is rejected': function(done){
        var promisified = Promise.promisify(function(time, callback){
          setTimeout(function(){
            callback(new Error('bang!'), time);
          }, time);
        });
        sync(function*(){
          try {
            var res = yield* sync(promisified(10));
          } catch(e) {
            expect(e.message).to.be.equal('bang!');
            done();
          }
        });
      }
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
    'if async fn returns one value': {
      'it should be passed to the yielding point': function(done){
        sync(function*(){
          var one = yield echo(1);
          expect(one).to.be.equal(1);
          done();
        })
      }
    },
    'if async fn returns multiple values': {
      'they should be passed to the yielding point as array': function(done){
        sync(function*(){
          var arr = yield echo(1,2,3,4,5);
          expect(arr).to.be.eql([1,2,3,4,5]);
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