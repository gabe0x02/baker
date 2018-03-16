const baker = require('../index');

function run() {
  console.log("RUN");
}

function connect() {
  console.log("CONNECT Database");
}

function disconect() {
  console.log("DISCONNECT Database");
}

if (require.main === module) {
  baker.setup(connect);
  baker.teardown(disconect);
  baker.command(run, { default: true, teardown: disconect });
  baker.run();
}
