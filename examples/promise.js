/* eslint import/no-extraneous-dependencies: "off" */

const baker = require('../index');
const request = require('request-promise');

function run() {
  return request('https://github.com/gabe0x02/baker-js').then((body) => {
    return `${body.trim().substring(0, 15)}...`;
  });
}

if (require.main === module) {
  baker.command(run, { default: true });
  baker.run();
}
