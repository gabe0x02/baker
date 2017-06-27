//This is baseline port of python baker: https://pypi.python.org/pypi/Baker/1.3

var _ = require('underscore');
var co = require('co');

var commands = {};
var default_command = null;
function command(func, options) {
  options = options ||{};
  var cmd = {
    func: func, 
    parameters: options.parameters || getParamNames(func),
    command: options.command || func.name,  
    default: options.default || false,
    required: options.required || [],
    opts_key: options.opts || null,
    args_key: options.args || null
  };

  commands[cmd.command] = cmd;
  if(cmd.default){
    if(default_command) {
      throw new Error("mulitple defualt commands");      
    } else {
      default_command = cmd.command;
    }
  }     
}

function run() {  
  var argv = require('minimist')(process.argv.slice(2));
  var command = null;
  if(argv._.length < 0 || !commands[argv._[0]]) {
    if(argv.help || argv.h) {
      //no command but help ... list commands
      printUsage();
      printCommands();      
    } else if(default_command) {
      command = default_command;
    }
  } else {
    command = argv._.shift();
  }
  if(argv.help || argv.h) {
    if(command) {
      printUsage(commands[command]);      
    } 
  } else if(!command) {
    console.error("No command specified");
  } else {          
    var args = assembleArgument(argv, commands[command]);
    if(args) {
      if(commands[command].func.constructor.name === 'GeneratorFunction') {
        //run generator
        co(function*(){
          var result = yield commands[command].func.apply(this, args);
          console.log(result);
        }).catch(function(e){
          console.error(e);
          console.error( e.stack );
          process.exit(1);
        });
      } else {
        //run function
        var result = commands[command].func.apply(this, args);        
        if(result){
          if(typeof result.then === "function") {
            // console.log("GOT PROMISE")
            result.then(function(result) {
              console.log(result);
            }, function(error){          
              console.log(error);
            }); 
          } else {
            console.log(result);
          }
        }               
      }
    } 
  }
}

function parseValue(value) {
  if(typeof(value) === 'string') {
    if(value === "true") {
      return true;
    }
    if(value === "false") {
      return false;
    }
    if(value.indexOf('\\-') === 0){
      value = value.substring(1);
    }
  }
  return value;
}

function assembleArgument(argv, command_data) {
  var required = command_data.required;
  var parameters = command_data.parameters;
  var opts = null;
  var extra_args = null;
  
  var param_count = parameters.length;
  if(command_data.opts_key) {
    opts = {};
    argv[command_data.opts_key] = opts;
    param_count--;
  }

  if(command_data.args_key) {
    extra_args = [];
    argv[command_data.args_key] = extra_args;
    param_count--;
  }

  
  var args = [];
  
  _.each(argv, function(value, option) {
    value = parseValue(value);
    if(option !== '_') {
      var idx = parameters.indexOf(option);
      if(idx === -1) {
        if(opts) {
          opts[option] = value;
        } else {
          console.error("Unknown option", "--"+option);
        }
        return null;
      } else {
        args[idx] = value;
      }
    }
  });
  
  _.each(argv._, function(value){
    value = parseValue(value);
    var arg_added = false;
    for(var i = 0; i < param_count; i++) {
      if(args[i] === undefined) {
        args[i] = value;
        arg_added = true;
        break;
      }
    }

    if(!arg_added) {
      extra_args.push(value);
    }
  });
  
  for(var i =0; i < required.length; i++) {
    var param = required[i];
    if(args[parameters.indexOf(param)] === undefined) {
      console.error("Required argument '"+param+"' not given");
      return null;
    }
  }
  
  if(!command_data.args_key && args.length > parameters.length) {
    console.error("Too many arguments to", "'"+command_data.command+"':", args.splice(parameters.length, args.length-parameters.length));
    return null;
  }
  return args;
}
function printUsage(command) {
  if(!command) {
    console.error("Usage:", process.argv[1], "COMMAND <options>");
  } else {
    // console.log
    var parameters = command.parameters;
    var required = command.required;
    var str = command.command;
    _.each(parameters, function(param){
      if(_.contains(required, param)) {
        str += " "+param;
      } else {
        str += " <"+param+">";
      }
    });
    console.error("Usage:", process.argv[1], str);    
    console.error("Required Arguments:\n");
    _.each(required, function(arg){
      console.error("  ", arg);
    });
    console.error("\nOptions:\n");
    _.each(parameters, function(param){
      // console.log("PARAM", param);
      if(!_.contains(required, param) && param !== command.opts_key){
        console.error("  ", "--"+param); 
      }      
    });
    console.error("");
    // console.error("(specifying a double hyphen (--) in the argument list means all");
    // console.error("subsequent arguments are treated as bare arguments, not options)");
  }
  
}
function printCommands() {
  console.error("Available commands: ");
  _.each(commands, function(func_data, command){
    console.error("   ", command);
  });
}

// var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
// // var STRIP_COMMENTS = /(\/\/.*$)|(\/\*[\s\S]*?\*\/)|(\s*=[^,\)]*(('(?:\\'|[^'\r\n])*')|("(?:\\"|[^"\r\n])*"))|(\s*=[^,\)]*))/mg
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func) {
//   var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//   var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//   if(result === null){
//      result = [];
//   }
//   return result;
// }


var FN_ARGS = /^function\s*[^\(]*\(\s*([^\)]*)\)/m;
var FN_ARG_SPLIT = /,/;
var FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
function getParamNames(fn) {
  var params,
      fnText,
      argDecl;


  if (typeof fn === 'function') {
      params = [];
      fnText = fn.toString().replace(STRIP_COMMENTS, '');
      argDecl = fnText.match(FN_ARGS);
      _.each(argDecl[1].split(FN_ARG_SPLIT), function(arg){
        arg.replace(FN_ARG, function(all, underscore, name){
          params.push(name);
        });
      });      
  }
  return params;
}

module.exports = { run: run, command: command, getParams: getParamNames };
