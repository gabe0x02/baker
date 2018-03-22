"strict";

/**
 * @file command.js
 *
 * A class representing a Command
 */

/**
 * @param {Function} func            the function that should be called when this command is called
 * @param {Object}   options
 * @param {String}   options.command name of the command.  If not provided then name of the funtion is used.
 * @param {Boolean}  options.default if true this command will be used if no command is found on the command line
 * @param {String}   options.opts    additonal named command line arguments will be added to an
 *                                   object as the "opts" parameter
 * @param {String}   options.args    additonal positional command line arguments will be added to
 *                                   an array as the "args" parameter
 * @param {String[]} parameters      list of parameters to the function.
 *                                   If not provided this is interaspected from the function
 * @param {String[]} required        list of parameters to the function that are required to be provided.
 * @param {Function} teardown        A function to be called after command is finished.
 *                                   Allows for connectons to be closed so script can exit cleanly.
 *
 */
class Command {
  constructor(func, options) {
    options = options || {};

    this.func = func;
    this.parameters = options.parameters || Command.getParamNames(func);
    this.name = options.command || func.name;
    this.default = options.default || false;
    this.required = options.required || [];
    this.opts_key = options.opts || null;
    this.args_key = options.args || null;
    this.teardown = options.teardown || null;

    if (!Array.isArray(this.required)) {
      this.required = [this.required];
    }

    if (this.opts_key && !this.parameters.includes(this.opts_key)) {
      throw Error("options key missing from parameters list");
    }

    if (this.args_key && !this.parameters.includes(this.args_key)) {
      throw Error("arguments key missing from parameters list");
    }
  }

  /**
   * parses parameters list from function
   * @param {Function} fn function to parse
   * @returns {String[]} list of parameters to the function
   */
  static getParamNames(fn) {
    const FN_ARGS = /^(?:function)?\s*[^(]*\(\s*([^)]*)\)/m;
    const FN_ARG_SPLIT = /,/;
    const FN_ARG = /^\s*(_?)(.+?)\1\s*$/;
    const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;

    let params;
    let fnText;
    let argDecl;


    if (typeof fn === 'function') {
      params = [];
      fnText = fn.toString().replace(STRIP_COMMENTS, '');
      argDecl = fnText.match(FN_ARGS);
      argDecl[1].split(FN_ARG_SPLIT).forEach((arg) => {
        arg.replace(FN_ARG, (all, underscore, name) => {
          params.push(name);
        });
      });
    } else {
      throw Error("function not provided");
    }
    return params;
  }

  /**
   * is parameter required to be passed to the command
   * @returns {Boolean} true if required
   */
  isParamRequired(param) {
    return this.required.includes(param);
  }

  /**
   * does command accept additional options
   * @returns {Boolean} true if command accepts options
   */
  acceptsOpts() {
    return this.opts_key != null;
  }

  /**
   * does command accept additional positional arguments
   * @returns {Boolean} true if command accepts arguments
   */
  acceptsArgs() {
    return this.args_key != null;
  }

  /**
   * get the index of a parameter to pass to the the command.
   * @param {String} param name of the parameter to the command
   * @returns {Number} index of the parameter
   *
   * @example
   *   cmd = new Command(function sum(a, b) {...})
   *   cmd.paramIndex("b") ==> 1
   */
  paramIndex(param) {
    return this.parameters.indexOf(param);
  }

  /**
   * get usage string for command
   * @param {String} filename name of the file this command is being run as
   * @returns {String} multi line usage info
   */
  getUsage(filename) {
    // console.log
    let output = "";
    let param_str = this.name;
    this.parameters.forEach((param) => {
      if (param !== this.opts_key && param !== this.args_key) {
        if (this.isParamRequired(param)) {
          param_str += ` ${param}`;
        } else {
          param_str += ` <${param}>`;
        }
      }
    });

    output += `Usage: ${filename} ${param_str}\n\n`;

    let required = "";
    this.required.forEach((arg) => {
      required += `  ${arg}\n`;
    });
    if (required.length) {
      output += "Required Arguments:\n";
      output += required;
    }

    let optional = "";
    this.parameters.forEach((opt) => {
      if (!this.isParamRequired(opt) && opt !== this.opts_key && opt !== this.args_key) {
        optional += `  --${opt}\n`;
      }
    });
    if (optional.length) {
      output += "Options:\n";
      output += optional;
    }
    output += "\n";
    // console.error("(specifying a double hyphen (--) in the argument list means all");
    // console.error("subsequent arguments are treated as bare arguments, not options)");
    return output;
  }
}

module.exports = Command;
