# Logging Guide for Barcode Backend

## Current Logging Status

**Currently, your application does NOT create log files.** All logs go to the console (stdout/stderr).

## Where to Find Logs

### On Hostinger (Production)

#### Option 1: PM2 Logs (If using PM2)

If you're using PM2 to run your application:

```bash
# View all logs
pm2 logs

# View logs for specific app
pm2 logs barcode-backend

# View only error logs
pm2 logs --err

# View only output logs
pm2 logs --out

# Save logs to file
pm2 logs --lines 1000 > app-logs.txt
```

**PM2 log file locations:**
- `~/.pm2/logs/barcode-backend-out.log` - Standard output
- `~/.pm2/logs/barcode-backend-error.log` - Error output

#### Option 2: Systemd Logs (If using systemd service)

```bash
# View logs
sudo journalctl -u barcode-backend -f

# View last 100 lines
sudo journalctl -u barcode-backend -n 100

# View logs from today
sudo journalctl -u barcode-backend --since today
```

#### Option 3: Direct Node.js Process

If running directly with `node src/server.js`:
- Logs go to the terminal/console where you started it
- No log files are created automatically

### On Local Development

When running locally:
- Logs appear in your terminal/console
- No log files are created

## Setting Up File Logging

I've created a logger utility (`src/utils/logger.util.js`) that will create log files. To use it:

### 1. Log Files Location

After implementing file logging, logs will be stored in:
```
barcode-backend/logs/
  ├── app-2024-12-28.log
  ├── app-2024-12-29.log
  └── ...
```

### 2. Enable File Logging

Update your code to use the logger:

**In `src/server.js`:**
```javascript
const logger = require('./utils/logger.util');

logger.info('Server starting...');
logger.info('Environment Configuration', {
  DB_HOST: process.env.DB_HOST ? 'Set' : 'Not set',
  PORT: process.env.PORT || 3000
});
```

**In `src/middlewares/error.middleware.js`:**
```javascript
const logger = require('../utils/logger.util');

module.exports = (err, req, res, next) => {
  logger.error('Error occurred', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
};
```

### 3. Log File Format

Logs are written in this format:
```
[2024-12-28T10:30:45.123Z] [INFO] Server starting...
{
  "DB_HOST": "Set",
  "PORT": 3000
}
```

### 4. Log Levels

- **INFO**: General information
- **ERROR**: Error messages
- **WARN**: Warning messages
- **DEBUG**: Debug information
- **REQUEST**: HTTP requests
- **RESPONSE**: HTTP responses

## Viewing Log Files

### On Hostinger (via SSH)

```bash
# View latest log file
tail -f logs/app-$(date +%Y-%m-%d).log

# View last 100 lines
tail -n 100 logs/app-$(date +%Y-%m-%d).log

# Search for errors
grep ERROR logs/app-*.log

# View all logs from today
cat logs/app-$(date +%Y-%m-%d).log
```

### Download Logs

```bash
# Download log file via SCP
scp user@hostinger-server:/path/to/barcode-backend/logs/app-2024-12-28.log ./
```

## Log Rotation

Log files are created daily (one file per day). To prevent disk space issues:

### Manual Cleanup

```bash
# Delete logs older than 30 days
find logs/ -name "*.log" -mtime +30 -delete
```

### Automatic Rotation (using logrotate)

Create `/etc/logrotate.d/barcode-backend`:

```
/path/to/barcode-backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 user user
}
```

## Database Logs

Your application also logs to the database:
- Table: `barcode_scan_history`
- Contains: Barcode scan actions, generation, downloads, etc.

To view database logs:
```sql
SELECT * FROM barcode_scan_history 
ORDER BY scanned_at DESC 
LIMIT 100;
```

## Quick Commands

```bash
# View PM2 logs (if using PM2)
pm2 logs barcode-backend --lines 100

# View systemd logs (if using systemd)
sudo journalctl -u barcode-backend -f

# View file logs (if file logging enabled)
tail -f logs/app-$(date +%Y-%m-%d).log

# Search for specific error
grep -i "error" logs/app-*.log

# Count errors today
grep -c "ERROR" logs/app-$(date +%Y-%m-%d).log
```

## Troubleshooting

### No Logs Appearing

1. **Check if app is running:**
   ```bash
   pm2 list  # If using PM2
   ps aux | grep node  # Check if Node.js process is running
   ```

2. **Check PM2 logs:**
   ```bash
   pm2 logs --lines 50
   ```

3. **Check file permissions:**
   ```bash
   ls -la logs/
   chmod 755 logs/
   ```

### Log Files Not Created

1. **Check if logs directory exists:**
   ```bash
   ls -la logs/
   ```

2. **Create logs directory:**
   ```bash
   mkdir -p logs
   chmod 755 logs
   ```

3. **Check write permissions:**
   ```bash
   touch logs/test.log
   rm logs/test.log
   ```

## Summary

- **Current**: Logs go to console only (no files)
- **PM2**: Check `~/.pm2/logs/` directory
- **Systemd**: Use `journalctl` command
- **File Logging**: Available via `logger.util.js` (needs to be integrated)
- **Database Logs**: Check `barcode_scan_history` table

