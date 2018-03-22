/* eslint no-throw-literal: "off" */
const baker = require("./baker");

// configure mock log functions
let logData = "";
const origLog = console.log;
function mockLog(...params) {
  logData += `${params.join(" ")}\n`;
  origLog(...params);
}

let errData = "";
const origError = console.error;
function mockError(...params) {
  errData += `${params.join(" ")}\n`;
  origError(...params);
}
console.log = mockLog;
console.error = mockError;

// baker test functions
function testFunc(one, two, three) {
  return one + two + three;
}

function defaultTest(one, two, three) {
  return one + (two * three);
}

function hasRequired(required) {
  return required;
}

function acceptsBools(True, False) {
  return True === true && False === false;
}

function throwsError() {
  throw Error("error thrown");
}

function throwsString() {
  throw "string thrown";
}


beforeEach(() => {
  logData = "";
  errData = "";
});

// tests
test("baker basic", () => {
  baker.command(testFunc);
  return baker.run(["node", "test.js", "testFunc", "1", "2", "3"])
  .then(() => {
    expect(logData.trim()).toBe("6");
  });
});

test("no default command", () => {
  return baker.run(["node", "test.js", "1", "2", "3"])
  .then(() => {
    expect(errData.trim()).toBe(`No command specified`);
  });
});


test("default command", () => {
  baker.command(defaultTest, { default: true });
  return baker.run(["node", "test.js", "1", "2", "3"])
  .then(() => {
    expect(logData.trim()).toBe("7");
  });
});

test("default command", () => {
  return baker.run(["node", "test.js"])
  .then(() => {
    expect(logData.trim()).toBe("");
    expect(errData.trim()).toBe("");
  });
});

test("multi default", () => {
  expect(() => {
    baker.command(() => { return 1; }, { command: "fail", default: true });
  }).toThrow("multiple default commands");
});

test("help functions", () => {
  return baker.run(["node", "test.js", "--help"])
  .then(() => {
    expect(logData.trim()).toBe("");
    expect(errData.trim()).toBe(`Usage: test.js COMMAND <options>
Available commands: 
    testFunc
    defaultTest`);
  });
});

test("command help", () => {
  return baker.run(["node", "test.js", "testFunc", "--help"])
  .then(() => {
    expect(logData.trim()).toBe("");
    expect(errData.trim()).toBe(`Usage: test.js testFunc <one> <two> <three>

Options:
  --one
  --two
  --three`);
  });
});

test("required param", () => {
  baker.command(hasRequired, { required: "required" });
  return baker.run(["node", "test.js", "hasRequired"])
  .then(() => {
    expect(logData.trim()).toBe("");
    expect(errData.trim()).toBe("Required argument 'required' not given");
  });
});

test("required param2", () => {
  return baker.run(["node", "test.js", "hasRequired", "req_val"])
  .then(() => {
    expect(logData.trim()).toBe("req_val");
    expect(errData.trim()).toBe("");
  });
});

test("throws error", () => {
  baker.command(throwsError);
  return baker.run(["node", "test.js", "throwsError"])
  .then(() => {
    expect(logData.trim()).toBe("");
    const errors = errData.split('\n');
    expect(errors[0].trim()).toBe("error thrown");
    expect(errors[1].trim()).toBe("Error: error thrown");
  });
});

test("throws string", () => {
  baker.command(throwsString);
  return baker.run(["node", "test.js", "throwsString"])
  .then(() => {
    expect(logData.trim()).toBe("");
    expect(errData.trim()).toBe("string thrown");
  });
});

test("boolean params", () => {
  baker.command(acceptsBools);
  return baker.run(["node", "test.js", "acceptsBools", "true", "false"])
  .then(() => {
    expect(logData.trim()).toBe("true");
    expect(errData.trim()).toBe("");
  });
});


test("options run", () => {
  baker.command(testFunc);
  return baker.run(["node", "test.js", "defaultTest", "2", "3", "--two=4"])
  .then(() => {
    expect(logData.trim()).toBe("14");
  });
});


test("setup and teardown and process.argv", () => {
  baker.setup(() => {
    console.log("setup");
  });
  baker.teardown(() => {
    console.log("teardown");
  });

  process.argv = ["node", "test.js", "testFunc", "2", "3", "--two=4"];
  return baker.run()
  .then(() => {
    expect(logData.trim()).toBe(`setup
9
teardown`);
  });
});
