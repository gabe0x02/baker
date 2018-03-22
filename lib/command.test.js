const Command = require("./command");

function testFunc(one, two, three) {
  return one + two + three;
}
function noParams() {
  return "no params";
}


test("getParamNames from function", () => {
  expect(Command.getParamNames(testFunc)).toEqual(["one", "two", "three"]);
});


test("getParamNames with no params", () => {
  expect(Command.getParamNames(noParams)).toEqual([]);
});

test("getParamNames with not a function", () => {
  expect(() => {
    Command.getParamNames("testFunc");
  }).toThrow();
});

test("getParamNames with arrow function", () => {
  const fn = (one, two, three) => { console.log(one, two, three); };
  expect(Command.getParamNames(fn)).toEqual(["one", "two", "three"]);
});

it("should be able to create a command instance", () => {
  let cmd = new Command(testFunc);
  expect(cmd.name).toBe("testFunc");

  cmd = new Command(testFunc, { command: "new_name" });
  expect(cmd.name).toBe("new_name");
});

// TODO: Test all options

it("should be able to generate usage docs", () => {
  const cmd = new Command(testFunc, { command: "sum" });
  const usage = `
Usage: test.js sum <one> <two> <three>

Options:
  --one
  --two
  --three
`;


  expect(cmd.getUsage("test.js").trim()).toBe(usage.trim());
});


test("options and arguments", () => {
  const cmd = new Command(testFunc, { command: "dostuff", required: "one", opts: "two", args: "three" });
  expect(cmd.acceptsOpts()).toBe(true);
  expect(cmd.acceptsArgs()).toBe(true);

  const usage = `
Usage: test.js dostuff one

Required Arguments:
  one

`;

  expect(cmd.getUsage("test.js").trim()).toBe(usage.trim());


  expect(() => {
    const optCmd = new Command(testFunc, { opts: "options" });
    console.log("CREATED COMMAND", optCmd.name);
  }).toThrow("options key missing from parameters list");

  expect(() => {
    const argCmd = new Command(testFunc, { args: "options" });
    console.log("CREATED COMMAND", argCmd.name);
  }).toThrow("arguments key missing from parameters list");
});

