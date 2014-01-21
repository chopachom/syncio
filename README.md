#Making async code sync#
Such generators, much synchronous, so stacktraces, wow.

`syncio` makes your IO related code look synchronous by using generators and generator delegation
from upcoming ES6 standard.

To use `syncio` you need Node.js >= 0.11.10 running with `--harmony` flag

```
npm install syncio
```

##Differences from other libraries##
Unlike other libraries the main idea of `syncio` is than you have to use it in one place,
generally to start up the application, and then you just use generators and `yield*` a.k.a "yield from" a.k.a
generator delegation to compose functions.

*Because `syncio` encourages to use generator delegation it preserves relevant stack traces.*

Example

```javascript
var sync = require('syncio');

// turning async node-style function into generator
var sleep = sync(function(time, resume){
  setTimeout(function(){resume(null, time)}, time);
});

sync(function* (){
  var slept = yield* sleep(100);
  // should print 100
  console.log(slept);
});
```

Now let's say, you have another function where you want to use sleep, this is how you do it with syncio

```javascript
var sync = require('syncio');

var sleep = sync(function(time, resume){
  setTimeout(function(){resume(null, time)}, time);
});

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