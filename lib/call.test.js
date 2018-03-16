const Command = require("./command");
const Call = require("./call");
const fs = require("fs-promise");

function testFunc(one, two, three) {
  return one + two + three;
}


test("command call", () => {
  const cmd = new Command(testFunc);
  const call = new Call(cmd);

  call.addOption("one", 1);
  call.addOption("two", 2);
  call.addOption("three", 3);

  expect(call.parameters).toEqual([1, 2, 3]);

  return call.run().then((result) => {
    expect(result).toBe(6);
  });
});

test("opts command", () => {
  function testOpts(options) {
    return options;
  }
  const cmd = new Command(testOpts, { opts: "options" });
  const call = new Call(cmd);

  call.addOption("one", 1);
  call.addOption("two", 2);
  call.addOption("three", 3);

  return call.run().then((result) => {
    expect(result).toEqual({ one: 1, two: 2, three: 3 });
  });
});

test("args command", () => {
  function testArgs(additonal_args) {
    return additonal_args;
  }

  const cmd = new Command(testArgs, { args: "additonal_args" });
  const call = new Call(cmd);

  call.addArgument(1);
  call.addArgument(2);
  call.addArgument(3);

  expect(call.arguments).toEqual([1, 2, 3]);
  return call.run().then((result) => {
    expect(result).toEqual([1, 2, 3]);
  });
});

test("optional and required", () => {
  function testFunc2(one, two, three, four) {
    return [one, two, three, four];
  }

  const cmd = new Command(testFunc2, { required: ["one", "two"] });
  const call = new Call(cmd);

  call.addOption("three", 3);
  call.addArgument(1);
  call.addOption("four", 4);
  call.addArgument(2);

  expect(call.parameters).toEqual([1, 2, 3, 4]);
  return call.run().then((result) => {
    expect(result).toEqual([1, 2, 3, 4]);
  });
});

test("test missing required", () => {
  function missingReq(one, two, three, four) {
    return [one, two, three, four];
  }

  const cmd = new Command(missingReq, { required: ["one", "two", "three", "four"] });
  const call = new Call(cmd);

  call.addArgument(1);
  call.addOption("three", 3);

  expect(call.getMissingRequired()).toEqual(["two", "four"]);

  expect(call.getErrors()).toEqual([
    "Required argument 'two' not given",
    "Required argument 'four' not given",
  ]);
});

test("Unknown options", () => {
  function unknownOptions(one, two, three, four) {
    return [one, two, three, four];
  }

  const cmd = new Command(unknownOptions);
  const call = new Call(cmd);

  call.addOption("five", 3);
  call.addOption("six", 3);

  expect(call.getErrors()).toEqual([
    "Unknown option --five",
    "Unknown option --six",
  ]);
});

test("Extra argument errors", () => {
  function extraArgs(one, two) {
    return [one, two];
  }

  const cmd = new Command(extraArgs, { opts: "two" });
  const call = new Call(cmd);

  call.addArgument(1);
  call.addArgument(2);
  call.addArgument(3);
  call.addArgument(4);

  expect(call.getErrors()).toEqual([
    "Too many arguments to 'extraArgs': [2, 3, 4]",
  ]);
});

test("all errors", () => {
  function allErrors(one, two) {
    return [one, two];
  }

  const cmd = new Command(allErrors, { required: "two" });
  const call = new Call(cmd);

  call.addOption("four", 4);
  call.addArgument(1);

  expect(call.getErrors()).toEqual([
    "Unknown option --four",
    "Required argument 'two' not given",
  ]);

  call.addArgument(2);
  call.addArgument(3);

  expect(call.getErrors()).toEqual([
    "Unknown option --four",
    "Too many arguments to 'allErrors': [3]",
  ]);
});

test("config exceptions", () => {
  function allErrors(one, two) {
    return [one, two];
  }

  const cmd = new Command(allErrors, { required: "two" });
  const call = new Call(cmd);

  expect(() => {
    call.addOption("one");
  }).toThrow("can not add option value of undefined");

  expect(() => {
    call.addArgument();
  }).toThrow("can not add argument value of undefined");
});

test("generator run", () => {
  function *genTest(filename) {
    const file = yield fs.readFile(filename);
    return file;
  }
  const cmd = new Command(genTest, { required: "two" });
  const call = new Call(cmd);

  call.addArgument("package.json");

  return call.run().then((pkg) => {
    pkg = JSON.parse(pkg);
    expect(pkg.name).toBe("baker-js");
  });
});
