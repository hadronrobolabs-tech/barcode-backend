# Understanding `process.env` in Node.js

## What is `process`?

`process` is a **global object** in Node.js that provides information about and control over the current Node.js process.

## What is `process.env`?

`process.env` is an object that contains all the **environment variables** available to the Node.js process.

### Environment Variables

Environment variables are key-value pairs that are set outside of your application code. They're commonly used for:
- Configuration settings
- Sensitive data (passwords, API keys)
- Different settings for different environments (development, production)

## How It Works in Your Code

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Root@123',
  database: process.env.DB_NAME || 'barcode_application',
  // ...
});
```

### Breaking It Down:

1. **`process.env.DB_HOST`** - Tries to read the `DB_HOST` environment variable
2. **`|| 'localhost'`** - If `DB_HOST` is not set (undefined), use `'localhost'` as the default value

This is called a **fallback/default value** pattern.

## How Environment Variables Are Loaded

In your `server.js` file:
```javascript
require('dotenv').config();  // This loads variables from .env file
```

The `dotenv` package reads a `.env` file in your project root and loads those variables into `process.env`.

## Example `.env` File

Create a `.env` file in your `barcode-backend` folder:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Root@123
DB_NAME=barcode_application
PORT=3000
JWT_SECRET=your_secret_key_here
```

## How It Works:

1. **When you start the server:**
   ```bash
   node src/server.js
   ```

2. **`dotenv.config()` runs first** (in `server.js`)
   - Reads `.env` file
   - Loads variables into `process.env`

3. **When `db.js` runs:**
   - `process.env.DB_HOST` = value from `.env` file (or undefined if not set)
   - If undefined, uses the default value after `||`

## Example:

### Without `.env` file (or variable not set):
```javascript
process.env.DB_HOST  // undefined
process.env.DB_HOST || 'localhost'  // Returns 'localhost' (default)
```

### With `.env` file containing `DB_HOST=192.168.1.100`:
```javascript
process.env.DB_HOST  // '192.168.1.100'
process.env.DB_HOST || 'localhost'  // Returns '192.168.1.100'
```

## Why Use Environment Variables?

### 1. **Security**
- Keep sensitive data (passwords, API keys) out of your code
- Don't commit `.env` to Git (add to `.gitignore`)

### 2. **Different Environments**
- **Development**: Use local database
- **Production (Hostinger)**: Use production database
- Same code, different configuration

### 3. **Easy Configuration**
- Change settings without modifying code
- No need to rebuild/redeploy for config changes

## Setting Environment Variables

### Method 1: `.env` file (Development)
```env
DB_HOST=localhost
DB_USER=myuser
DB_PASSWORD=mypassword
```

### Method 2: Command Line (Temporary)
```bash
DB_HOST=localhost DB_USER=root node src/server.js
```

### Method 3: System Environment Variables (Production)
On Hostinger, set environment variables in:
- Control Panel → Environment Variables
- Or via SSH: `export DB_HOST=your_host`

## Common `process` Properties

```javascript
process.env          // Environment variables
process.argv         // Command line arguments
process.cwd()        // Current working directory
process.exit()       // Exit the process
process.version      // Node.js version
```

## Summary

- `process` = Global Node.js object
- `process.env` = Environment variables object
- `process.env.DB_HOST` = Reads `DB_HOST` environment variable
- `process.env.DB_HOST || 'localhost'` = Use env variable OR default value
- `.env` file = Where you store environment variables (loaded by `dotenv`)

