/**
 * Simple Logger Utility
 * For now, uses console.log with better formatting
 * Can be upgraded to Winston later if needed
 */

const chalk = require('chalk');

class Logger {
  static info(message, ...args) {
    console.log(chalk.blue('[INFO]'), new Date().toISOString(), message, ...args);
  }

  static success(message, ...args) {
    console.log(chalk.green('[SUCCESS]'), new Date().toISOString(), message, ...args);
  }

  static error(message, ...args) {
    console.error(chalk.red('[ERROR]'), new Date().toISOString(), message, ...args);
  }

  static warn(message, ...args) {
    console.warn(chalk.yellow('[WARN]'), new Date().toISOString(), message, ...args);
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray('[DEBUG]'), new Date().toISOString(), message, ...args);
    }
  }

  static http(method, path, statusCode, duration) {
    const colorMap = {
      GET: chalk.green,
      POST: chalk.blue,
      PUT: chalk.yellow,
      PATCH: chalk.yellow,
      DELETE: chalk.red
    };
    
    const methodColor = colorMap[method] || chalk.white;
    const statusColor = statusCode < 400 ? chalk.green : chalk.red;
    
    console.log(
      chalk.gray('[HTTP]'),
      new Date().toISOString(),
      methodColor(method),
      path,
      statusColor(statusCode),
      chalk.gray(`${duration}ms`)
    );
  }
}

module.exports = Logger;
