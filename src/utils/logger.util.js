const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Get log file path based on date
const getLogFilePath = (type = 'app') => {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(logsDir, `${type}-${date}.log`);
};

// Format log message
const formatMessage = (level, message, data = null) => {
  const timestamp = new Date().toISOString();
  let logMessage = `[${timestamp}] [${level}] ${message}`;
  
  if (data) {
    logMessage += `\n${JSON.stringify(data, null, 2)}`;
  }
  
  return logMessage + '\n';
};

// Write to log file
const writeLog = (level, message, data = null) => {
  const logMessage = formatMessage(level, message, data);
  const logFile = getLogFilePath('app');
  
  try {
    fs.appendFileSync(logFile, logMessage);
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
  
  // Also output to console
  if (level === 'ERROR') {
    console.error(`[${level}] ${message}`, data || '');
  } else {
    console.log(`[${level}] ${message}`, data || '');
  }
};

// Logger object
const logger = {
  info: (message, data) => writeLog('INFO', message, data),
  error: (message, data) => writeLog('ERROR', message, data),
  warn: (message, data) => writeLog('WARN', message, data),
  debug: (message, data) => writeLog('DEBUG', message, data),
  
  // Request logging
  request: (req) => {
    const message = `${req.method} ${req.path}`;
    const data = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
    };
    writeLog('REQUEST', message, data);
  },
  
  // Response logging
  response: (req, statusCode, responseTime) => {
    const message = `${req.method} ${req.path} - ${statusCode}`;
    const data = {
      statusCode,
      responseTime: `${responseTime}ms`
    };
    writeLog('RESPONSE', message, data);
  }
};

module.exports = logger;

