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

- Node.js
- Express.js
- MySQL
- JWT Authentication
- PDFKit (for barcode PDF generation)
- bwip-js (for barcode image generation)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with the following variables:
```
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

3. Run database migrations (if any)

4. Start the server:
```bash
npm start
```

## API Endpoints

- `/api/auth` - Authentication
- `/api/barcodes` - Barcode operations
- `/api/kits` - Kit management
- `/api/boxes` - Box packing
- `/api/history` - Barcode history

## License

MIT

