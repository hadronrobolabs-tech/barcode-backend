# Barcode Backend API

Node.js/Express backend API for barcode management system.

## Features

- Barcode generation and management
- Component and kit management
- Box packing functionality
- User authentication (JWT)
- Barcode scanning and tracking
- Complete audit trail

## Tech Stack

- Node.js 22.x
- Express.js 5.x
- MySQL
- JWT Authentication
- PDFKit (for barcode PDF generation)
- bwip-js (for barcode image generation)

## Requirements

- Node.js >= 22.0.0
- npm >= 10.0.0

## Setup

**Note:** This project requires Node.js 22.x. Make sure you have the correct version installed.

1. Install dependencies:
```bash
npm install
```

If using nvm, the `.nvmrc` file will automatically use Node.js 22:
```bash
nvm use
```

2. Create `.env` file in the root directory with the following variables:
```env
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

3. Run database migrations (if any):
   - Check for any SQL migration files in the project root
   - Run them against your database

4. Start the server:
```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | MySQL database host | `localhost` |
| `DB_USER` | MySQL database user | `root` |
| `DB_PASSWORD` | MySQL database password | - |
| `DB_NAME` | MySQL database name | `barcode_application` |
| `JWT_SECRET` | Secret key for JWT tokens | - |
| `PORT` | Server port | `3000` |

## API Endpoints

- `/api/auth` - Authentication
- `/api/barcodes` - Barcode operations
- `/api/kits` - Kit management
- `/api/boxes` - Box packing
- `/api/history` - Barcode history

## License

MIT

