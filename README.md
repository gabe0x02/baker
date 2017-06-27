# baker
Baker lets you easily add a command line interface to your node scripts that is inspired by python baker library (https://pypi.python.org/pypi/Baker/1.3)


# Usage
example.js
```
let baker = require('./baker');
function run(a, b, c) {
     console.log("Run", a, b, c);
}
function tester(a, rest, options) {
     console.log("Test", a, rest, options);
}


if (require.main === module) {
    baker.command(tester, {command: "test", args: "rest", opts: "options"});
    baker.command(run, {default: true, required: ["a"]});
    baker.run();
}
```

output
```
$ node example.js --help
Usage: /Users/gabriellittman/Development/baker-js/example.js COMMAND <options>
Available commands: 
    test
    run

$ node example.js run --help
Usage: /Users/gabriellittman/Development/baker-js/example.js run a <b> <c>
Required Arguments:

   a

Options:

   --b
   --c

$ node example.js run 1 2 3
Run 1 2 3

$ node example.js test 1 2 3 4 --five 5 --six 6 7
Test 1 [ 2, 3, 4, 7 ] { five: 5, six: 6 }
```

# Options
```
baker.command(func, options)
@param Function func
@param Object options
@param String options.command name of command, defaults to function name.  Requried for anonymous functions.
@param Boolean options.default If true this function will run if no command name given on command line.
@param Array options.required List of requried args.  Script will eixt with error if arg not found on command line.
@param String options.opts Name of parameter to recieve object with all unmatche named commandline args.
@param String options.args Name of parameter to recieve an array of unmatched positional command line args.
```                    

# CO itergration
Baker also supports co generator flow control. (https://github.com/tj/co)  Simply pass in a generator and write some synchronous looking code..

generator_example.js
```javascript
let baker = require('./baker');
let request = require('request-promise');

function *run() {
  let start = new Date();
  console.log("Start");
  let body = yield request('https://github.com/gabe0x02/baker-js');
  console.log("End")
  console.log("Length:", body.length, "chars");
  console.log("Duration:", new Date()-start, "ms"); 
  
  return body.trim().substring(0, 15) + '...';
}

if (require.main === module) {
    baker.command(run, {default: true}  );
    baker.run();
}
```

output
```
$ node generator_example.js 
Start
End
Length: 48018 chars
Duration: 2019 ms
<!DOCTYPE html>...
```



# Tests                
Still needed...
