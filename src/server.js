// Load environment variables
// Try to load from .env file (for local development)
// On Hostinger, environment variables are set via control panel and available directly
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Debug: Log environment variables (remove in production if sensitive)
console.log('🔧 Environment Configuration:');
console.log('  DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Not set');
console.log('  DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ Not set');
console.log('  DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Not set');
console.log('  PORT:', process.env.PORT || 3000);

const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
