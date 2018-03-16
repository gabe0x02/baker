/* eslint import/no-extraneous-dependencies: "off" */
const baker = require('../index');
const request = require('request-promise');

function *run() {
  const start = new Date();
  console.log("Start");
  const body = yield request('https://github.com/gabe0x02/baker-js');
  console.log("End");
  console.log("Length:", body.length, "chars");
  console.log("Duration:", new Date() - start, "ms");

  return `${body.trim().substring(0, 15)}...`;
}

if (require.main === module) {
  baker.command(run, { default: true });
  baker.run();
}
