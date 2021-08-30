const fs = require('fs')
const util = require('./util')

const configPath = 'test/recurring.config.json'

exports.init = init

function init () {
  if (fs.existsSync(configPath)) {
    console.log(`- found ${configPath}`)
    return require('./recurring.config.json');
  }
  let config = {
    CONTROLLED_ACCOUNT : util.createAccount(),
    DESTINATION_ACCOUNT: util.createAccount(),
  }
  fs.writeFileSync(configPath, JSON.stringify(config))
  return config;
}
