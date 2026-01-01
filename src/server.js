// ===============================
// Hostinger Public Bind FIX
// ===============================

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

console.log('🔧 Environment Configuration:');
console.log('DB_HOST:', process.env.DB_HOST ? '✅ Set' : '❌ Not set');
console.log('DB_USER:', process.env.DB_USER ? '✅ Set' : '❌ Not set');
console.log('DB_NAME:', process.env.DB_NAME ? '✅ Set' : '❌ Not set');
console.log('PORT:', process.env.PORT || 3000);

const app = require('./app');

const PORT = process.env.PORT || 3000;

// 🔥 THIS IS THE MAGIC FIX — binds Node to public Hostinger proxy
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend LIVE at public port ${PORT}`);
});
