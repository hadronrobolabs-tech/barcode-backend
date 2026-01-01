const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Environment Configuration:');
console.log('DB_HOST:', process.env.DB_HOST ? 'SET' : 'NOT SET');
console.log('DB_USER:', process.env.DB_USER ? 'SET' : 'NOT SET');
console.log('DB_NAME:', process.env.DB_NAME ? 'SET' : 'NOT SET');
console.log('PORT:', process.env.PORT);

const app = require('./app');

/*
🔥 DO NOT LISTEN ON HOSTINGER.
Hostinger automatically injects the server.
Just export the Express app.
*/

module.exports = app;
