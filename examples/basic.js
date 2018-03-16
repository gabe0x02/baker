const baker = require('../index');

function run(a, b, c) {
  console.log("Run", a, b, c);
}
function tester(a, rest, options) {
  console.log("Test", a, rest, options);
}


if (require.main === module) {
  baker.command(tester, { command: "test", args: "rest", opts: "options" });
  baker.command(run, { default: true, required: ["a"] });


  baker.run();
}
