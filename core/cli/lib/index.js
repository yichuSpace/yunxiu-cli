'use strict';

module.exports = core;

const pkg = require('../package.json')
const log = require('@yunxiu-cli/log')
function core() {
  checkVersion()
}


function checkVersion() {
  console.log(pkg.version)
  // or
  log.info(pkg.version)
}