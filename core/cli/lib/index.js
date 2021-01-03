'use strict';

module.exports = core;

const path = require('path');
const log = require('@yunxiu-cli/log')
const semver = require('semver')
const colors = require('colors/safe')
const userHome = require('user-home')
const pathExists = require('path-exists').sync

const constant = require('./const')
const pkg = require('../package.json')

let args
let config

async function core() {
  try {
    checkVersion()
    checkNodeVersion()
    checkRoot()
    checkUserHome()
    checkInputArgs();
    checkEnv();
    await checkGlobalUpdate();
  } catch (e) {
    log.error(e.message);
  }
}

// 检查是否为最新版本
async function checkGlobalUpdate() {
  // 获取当前用户安装的版本是多少
  const currentVersion = pkg.version
  const npmName = pkg.name
  // 通过接口请求拿到最新的版本号
  const { getNpmSemverVersion } = require('@yunxiu-cli/get-npm-info')
  const latestVersion = await getNpmSemverVersion(currentVersion, npmName)
  // 拿npm上最新的版本号和本地安装的版本号进行对比，如果前者大于后者，则给用户一个明显的提示
  if (latestVersion && semver.gt(latestVersion, currentVersion)) {
    log.warn(
      colors.yellow(`请手动更新${npmName}, 当前版本:${currentVersion}, 最新版本: ${latestVersion}
                更新命令: npm install -g ${npmName}
      `)
    )
  }
}
// 检查环境变量
function checkEnv() {
  const dotenv = require('dotenv')
  const dotenvPath = path.resolve(userHome, '.env')
  if (pathExists(dotenvPath)) {
    config = dotenv.config({
      path: dotenvPath
    })
  }
  config = createDefaultConfig()
  log.verbose('环境变量', config, process.env.CLI_HOME)
}

// 创建默认的环境变量配置
function createDefaultConfig() {
  const cliConfig = {
    home: userHome
  }
  if (process.env.CLI_HOME) {
    cliConfig['cliHome'] = path.join(userHome, process.env.CLI_HOME)
  } else {
    cliConfig['cliHome'] = path.join(userHome, constant.DEFAULT_CLI_HOME)
  }
  return cliConfig
}

// 检查入参
function checkInputArgs() {
  args = require('minimist')(process.argv.slice(2))
  checkArgs()
}

function checkArgs() {
  if (args.debug) {
    process.env.LOG_LEVEL = 'verbose'
  } else {
    process.env.LOG_LEVEL = 'info'
  }
  log.level = process.env.LOG_LEVEL
}
// 检查用户主目录
function checkUserHome() {
  if (!userHome || !pathExists(userHome)) {
    throw new Error(colors.red('当前用户主目录不存在，请检查!'))
  }
}

// 检查 root 是否启动
function checkRoot() {
  const rootCheck = require('root-check')
  rootCheck()  //实现 root 降级，规避掉因为 root 用户带来的一系列权限问题
}

// 检查node版本
function checkNodeVersion() {
  const currentVersion = process.version // 获取当前的 node 版本
  const lowestVersion = constant.LOWEST_NODE_VERSION // 预设好的版本
  // 如果当前版本较低，那么给用户一个提示
  if (!semver.gte(currentVersion, lowestVersion)) {
    throw new Error(colors.red(`yunxiu-cli 需要安装${lowestVersion}版本及以上的Node.js`))
  }
}

// 检查脚手架版本号
function checkVersion() {
  log.info('cli', pkg.version)
}