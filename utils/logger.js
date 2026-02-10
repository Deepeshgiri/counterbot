const chalk = require('chalk');

/**
 * Colored logging utility for better console visibility
 */
class Logger {
  static info(message) {
    console.log(chalk.blue('[INFO]'), message);
  }

  static success(message) {
    console.log(chalk.green('[SUCCESS]'), message);
  }

  static warn(message) {
    console.log(chalk.yellow('[WARN]'), message);
  }

  static error(message, error = null) {
    console.log(chalk.red('[ERROR]'), message);
    if (error) {
      console.error(chalk.red(error.stack || error));
    }
  }

  static debug(message) {
    console.log(chalk.gray('[DEBUG]'), message);
  }

  static command(commandName, user) {
    console.log(chalk.magenta('[COMMAND]'), `${commandName} used by ${user}`);
  }
}

module.exports = Logger;
