# Hostinger Deployment Guide

## Node.js Version Requirements

This backend requires **Node.js 22.x** and **npm 10.x or higher**.

## Setup on Hostinger

### 1. Set Node.js Version

In your Hostinger control panel or via SSH:

```bash
# If using nvm
nvm install 22
nvm use 22

# Or set Node.js version in Hostinger control panel to 22.x
```

### 2. Install Dependencies

```bash
cd /path/to/barcode-backend
npm install --production
```

### 3. Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=your_hostinger_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
JWT_SECRET=your_secure_jwt_secret_key
PORT=3000
NODE_ENV=production
```

### 4. Database Setup

- Ensure your MySQL database is created
- Run any migration scripts if needed
- Verify database connection

### 5. Start the Server

#### Option A: Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start src/server.js --name barcode-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on server reboot
pm2 startup
```

#### Option B: Using systemd service

Create `/etc/systemd/system/barcode-backend.service`:

```ini
[Unit]
Description=Barcode Backend API
After=network.target

[Service]
Type=simple
User=your_user
WorkingDirectory=/path/to/barcode-backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable barcode-backend
sudo systemctl start barcode-backend
```

#### Option C: Direct Node.js

```bash
node src/server.js
```

### 6. Verify Deployment

- Check if the server is running: `curl http://localhost:3000/api/health` (if health endpoint exists)
- Check logs for any errors
- Test API endpoints from your frontend

## Troubleshooting

### Node.js Version Issues

If you get errors about Node.js version:
1. Verify Node.js version: `node --version` (should be 22.x)
2. Check `.nvmrc` file exists and contains `22`
3. Check `package.json` has `engines.node: ">=22.0.0"`

### Port Issues

- Ensure the PORT in `.env` matches your Hostinger configuration
- Check if the port is open in firewall
- Verify no other service is using the same port

### Database Connection Issues

- Verify database credentials in `.env`
- Check if database host allows connections from your server IP
- Test database connection manually

### Express 5 Compatibility

Express 5.x requires Node.js 18+ and works perfectly with Node.js 22.

## Production Checklist

- [ ] Node.js 22.x installed
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env` file configured with correct values
- [ ] Database created and migrations run
- [ ] Server starts without errors
- [ ] PM2 or process manager configured (optional but recommended)
- [ ] Firewall/security configured
- [ ] SSL certificate configured (if using HTTPS)
- [ ] CORS configured correctly for your frontend domain

