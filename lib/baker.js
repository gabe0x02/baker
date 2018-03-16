"strict";

/**
 * @file
 * Baker makes creating command line scripts easy.  Make any function or generator callable from the command line.
 *
 * This is baseline port of python baker: https://pypi.python.org/pypi/Baker/1.3
 */

const Command = require("./command");
const CommandCall = require("./call");
const minimist = require('minimist');
const co = require("co");
const path = require("path");

const commands = {};
let default_command = null;
let setup = () => { return Promise.resolve(); };
let teardown = () => { return Promise.resolve(); };


function addCommand(func, options) {
  const cmd = new Command(func, options);
  if (cmd.default) {
    if (default_command) {
      throw new Error("multiple default commands");
    } else {
      default_command = cmd.name;
    }
  }
  commands[cmd.name] = cmd;
}


/**
 * Prints the help text to stderr
 * @param {Command} paramName paramDescription
 */
function handleHelp(command) {
  if (!command) {
    // no command but help ... list commands
    printUsage();
    printCommands();
  } else {
    printUsage(command);
  }
}

/**
 * run baker
 * @param {String[]} argv command line arguments.  If not provided process.argv is used.
 */
function run(argv) {
  argv = argv || process.argv;
  argv = minimist(argv.slice(2));
  let command_name = argv._.shift();
  let command = commands[command_name];

  if (argv.help || argv.h) {
    handleHelp(command);
    return Promise.resolve();
  }

  if (!command) {
    if (command_name) {
      argv._.unshift(command_name);
    }
    command_name = default_command;
    command = commands[command_name];
  }

  if (!command) {
    console.error("No command specified");
    return Promise.resolve();
  }


  const call = assembleCall(argv, command);

  // check for errors
  const errors = call.getErrors();
  if (errors.length) {
    errors.forEach((error) => {
      console.error(error);
    });
    return Promise.resolve();
  }

  // run command
  return setup().then(call.run.bind(call))
    .then((output) => {
      if (output) {
        console.log(output);
      }
    }).catch((error) => {
      if (error.message) {
        console.error(error.message);
      } else {
        console.error(error);
      }
      if (error.stack) {
        console.error(error.stack);
      }
    })
    .then(teardown);
}

function parseValue(_value) {
  const value = _value;
  if (typeof (value) === 'string') {
    if (value === "true") {
      return true;
    }
    if (value === "false") {
      return false;
    }
  }
  return value;
}

function assembleCall(argv, command) {
  const call = new CommandCall(command);

  Object.keys(argv).forEach((option) => {
    const value = parseValue(argv[option]);
    if (option !== '_') {
      call.addOption(option, value);
    }
  });

  argv._.forEach((value) => {
    value = parseValue(value);
    call.addArgument(value);
  });

  return call;
}

function printUsage(command) {
  if (!command) {
    console.error("Usage:", path.basename(process.argv[1]), "COMMAND <options>");
  } else {
    console.error(command.getUsage(path.basename(process.argv[1])));
  }
}


function printCommands() {
  console.error("Available commands: ");
  Object.keys(commands).forEach((command) => {
    console.error("   ", command);
  });
}


function setTeardown(func) {
  teardown = co.wrap(func);
}

function setSetup(func) {
  setup = co.wrap(func);
}

module.exports = { run: run, command: addCommand, setup: setSetup, teardown: setTeardown };
