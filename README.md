[![Build Status](https://api.travis-ci.org/chopachom/syncio.png?branch=master)](https://travis-ci.org/chopachom/syncio)
#Making async code sync#
Such generators, much synchronous, so stacktraces, wow.

`syncio` makes your IO related code look synchronous by using generators and generator delegation
from upcoming ES6 standard. *And it makes your stack traces long and shiny!*

To use `syncio` you need Node.js >= 0.11.10 running with `--harmony` flag. Version for browsers is coming soon

```
npm install syncio
```

##Differences from other libraries##
Unlike other libraries the main idea of `syncio` is than you have to use it in one place,
generally to start up the application, and then you just use generators and `yield*` a.k.a "yield from" a.k.a
generator delegation to compose functions.

*Because `syncio` encourages to use generator delegation it preserves relevant stack traces.*

##Examples##

```javascript
var sync = require('syncio');

// turning async node-style function into generator
var sleep = sync(function(time, resume){
  setTimeout(function(){resume(null, time)}, time);
});

// wraps and executes the generator
sync(function* (){
  var slept = yield* sleep(100);
  // should print 100
  console.log(slept);
});
```

Now let's say, you have another function where you want to use sleep, this is how you do it with syncio

```javascript
var echo = function* (value){
  yield* sleep(1000);
  // straightforward stack traces
  console.trace(value);
  return value;
};

var greet = function* (name){
  return yield* echo('Hello, ' + name);
};

sync(function* (){
  var greeting = yield* greet('John Doe');
  // should print Hello, John Doe
  console.log(greeting);
});
```

`syncio` tries its best to keep generator call stack when asynchronous functions throw errors

```
// that what you'd get in the greeting example above if sleep function returns an error and you don't use syncio
Error: 1000
    at null._onTimeout (/home/qweqwe/sleep.js:43:32)
    at Timer.listOnTimeout (timers.js:124:15)

// and this is what you get when you use syncio
Error: 1000
    at null._onTimeout (/home/qweqwe/sleep.js:43:32)
    at Timer.listOnTimeout (timers.js:124:15)
from syncio generator (cleaned):
    at echo (/home/qweqwe/sleep.js:47:10)
    at greet (/home/qweqwe/sleep.js:54:17)
    at /home/qweqwe/sleep.js:58:25
```


##Parallel execution##
`syncio` also supports parallel execution of generators
```javascript
var sync = require('./index');
// "denodeify" the function into a generator
var request = sync(require('request'));

function* status(url){
  var response = yield* request(url);
  return response[0].statusCode;
}

sync(function* (){
  var google = status('http://google.com');
  var reddit = status('http://reddit.com');
  var github = status('http://github.com');
  var results = yield* sync.join([google, reddit, github]);
  console.log(results);
});
```


##License##
MIT
