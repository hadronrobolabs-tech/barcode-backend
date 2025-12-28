# Setting Environment Variables on Hostinger

## Problem: Environment Variables Not Loading

If your environment variables are not being picked up on Hostinger, follow these solutions:

## Solution 1: Use Hostinger Control Panel (Recommended)

Hostinger allows you to set environment variables directly in the control panel. These are automatically available to your Node.js application.

### Steps:

1. **Log into Hostinger Control Panel**
2. **Navigate to your application/domain settings**
3. **Find "Environment Variables" or "App Settings"**
4. **Add your variables:**

   ```
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   ```

5. **Save and restart your application**

### Important Notes:
- **No `.env` file needed** when using control panel
- Variables are automatically available in `process.env`
- Restart your Node.js app after adding variables

## Solution 2: Use .env File

If Hostinger control panel doesn't support environment variables, use a `.env` file:

### Steps:

1. **Create `.env` file in your project root** (`barcode-backend/.env`):

   ```env
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_NAME=your_database_name
   PORT=3000
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=production
   ```

2. **Upload `.env` file to Hostinger** (same directory as `package.json`)

3. **Ensure file permissions:**
   ```bash
   chmod 600 .env  # Read/write for owner only (more secure)
   ```

4. **Restart your application**

### File Structure on Hostinger:
```
/home/username/your-app/
  ├── .env              ← Must be here (project root)
  ├── package.json
  ├── src/
  │   ├── server.js
  │   └── ...
  └── node_modules/
```

## Solution 3: Set via SSH (VPS Only)

If you have SSH access:

```bash
# Set environment variables for current session
export DB_HOST=your_host
export DB_USER=your_user
export DB_PASSWORD=your_password
export DB_NAME=your_database

# Start your app
node src/server.js
```

### Make it permanent (add to ~/.bashrc or ~/.profile):
```bash
echo 'export DB_HOST=your_host' >> ~/.bashrc
echo 'export DB_USER=your_user' >> ~/.bashrc
echo 'export DB_PASSWORD=your_password' >> ~/.bashrc
source ~/.bashrc
```

## Solution 4: Use PM2 with Environment File

If using PM2 process manager:

1. **Create `ecosystem.config.js`** in project root:

   ```javascript
   module.exports = {
     apps: [{
       name: 'barcode-backend',
       script: 'src/server.js',
       env: {
         NODE_ENV: 'production',
         DB_HOST: 'your_host',
         DB_USER: 'your_user',
         DB_PASSWORD: 'your_password',
         DB_NAME: 'your_database',
         PORT: 3000,
         JWT_SECRET: 'your_secret'
       }
     }]
   };
   ```

2. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.js
   ```

## Troubleshooting

### Check if variables are loading:

Add this to `server.js` temporarily:
```javascript
console.log('Environment Variables:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
```

### Common Issues:

1. **Variables not set in control panel:**
   - Double-check spelling (case-sensitive)
   - Ensure no extra spaces
   - Restart application after setting

2. **`.env` file not found:**
   - Verify file is in project root (same level as `package.json`)
   - Check file name is exactly `.env` (not `.env.txt`)
   - Verify file permissions

3. **Wrong working directory:**
   - Ensure you're running from project root
   - Use absolute path in `dotenv.config()`

4. **Variables set but not accessible:**
   - Restart Node.js process
   - Check if using PM2: `pm2 restart all`
   - Clear any cached processes

### Test Environment Variables:

Create a test endpoint in your app:
```javascript
app.get('/test-env', (req, res) => {
  res.json({
    DB_HOST: process.env.DB_HOST ? '✅ Set' : '❌ Not set',
    DB_USER: process.env.DB_USER ? '✅ Set' : '❌ Not set',
    DB_NAME: process.env.DB_NAME ? '✅ Set' : '❌ Not set',
    PORT: process.env.PORT || 'Not set'
  });
});
```

Visit: `https://your-domain.com/test-env` to check.

## Security Best Practices

1. **Never commit `.env` to Git:**
   - Add `.env` to `.gitignore`
   - Use `.env.example` as template

2. **Use strong passwords:**
   - Generate secure passwords for database
   - Use long, random JWT secrets

3. **Restrict file permissions:**
   ```bash
   chmod 600 .env  # Only owner can read/write
   ```

4. **Use Hostinger control panel** (more secure than `.env` file)

## Quick Checklist

- [ ] Environment variables set in Hostinger control panel OR `.env` file uploaded
- [ ] Variables match exactly (case-sensitive): `DB_HOST`, `DB_USER`, etc.
- [ ] Application restarted after setting variables
- [ ] Test endpoint shows variables are loaded
- [ ] Database connection works
- [ ] `.env` file not committed to Git (if using `.env`)

## Need Help?

If still not working:
1. Check Hostinger documentation for your hosting plan
2. Contact Hostinger support
3. Verify Node.js version matches requirements
4. Check application logs for errors

