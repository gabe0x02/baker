/**
 * @file call
 *
 * Object representing a call of a command.
 */

const co = require("co");

class CommandCall {
  /**
   * @param {Command} command command object
   */
  constructor(command) {
    this.command = command;
    this.parameters = [];  // values to be used as arguments to the function call
    this.options = {};    // additional option values
    this.arguments = [];  // additional positional arguments


    this.param_count = command.parameters.length;
    if (this.command.acceptsOpts()) {
      const idx = this.command.paramIndex(command.opts_key);
      this.parameters[idx] = this.options;
      this.param_count--;
    }

    if (this.command.acceptsArgs()) {
      const idx = this.command.paramIndex(command.args_key);
      this.parameters[idx] = this.arguments;
      this.param_count--;
    }
  }

  addOption(opt, value) {
    if (value === undefined) {
      throw Error("can not add option value of undefined");
    }

    const idx = this.command.paramIndex(opt);
    if (idx === -1) {
      this.options[opt] = value;
    } else {
      this.parameters[idx] = value;
    }
  }

  addArgument(value) {
    if (value === undefined) {
      throw Error("can not add argument value of undefined");
    }

    let arg_added = false;
    for (let i = 0; i < this.command.parameters.length; i++) {
      if (this.parameters[i] === undefined) {
        this.parameters[i] = value;
        arg_added = true;
        break;
      }
    }

    if (!arg_added) {
      this.arguments.push(value);
    }
  }

  /**
   * get a list of required arguments that are still missing
   */
  getMissingRequired() {
    const required = this.command.required;
    const missing = [];
    for (let i = 0; i < required.length; i++) {
      const param = required[i];
      const idx = this.command.paramIndex(param);
      if (this.parameters[idx] === undefined) {
        missing.push(param);
      }
    }
    return missing;
  }

  /**
   * get list of error strings
   * @returns {String[]} Array of error message strings.
   */
  getErrors() {
    const errors = [];
    if (!this.command.acceptsOpts()) {
      Object.keys(this.options).forEach((option) => {
        errors.push(`Unknown option --${option}`);
      });
    }


    this.getMissingRequired().forEach((param) => {
      errors.push(`Required argument '${param}' not given`);
    });


    if (!this.command.acceptsArgs() && this.arguments.length) {
      errors.push(`Too many arguments to '${this.command.name}': [${this.arguments.join(", ")}]`);
    }
    return errors;
  }

  /**
   * run command
   */
  run() {
    let func = this.command.func;

    // wrap generator into function that returns promise
    if (func.constructor.name === 'GeneratorFunction') {
      func = co.wrap(func);
    }

    return Promise.resolve(func.apply(this, this.parameters));
  }
}

module.exports = CommandCall;
