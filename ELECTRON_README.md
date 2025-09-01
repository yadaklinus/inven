# POS System - Electron Application

This is a complete Electron wrapper for your Next.js POS system application with full database support, API routes, and auto-updater functionality.

## 🚀 Features

- **Full Electron Integration**: Complete desktop application with native OS integration
- **Dual Database Support**: SQLite (offline) and PostgreSQL (online) with sync capabilities
- **Express API Server**: Full REST API for all POS operations
- **Auto-Updater**: Automatic application updates with GitHub releases
- **Cross-Platform**: Windows, macOS, and Linux support
- **Production Ready**: Optimized builds with proper packaging

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Git (for auto-updater)

## 🛠️ Setup

### 1. Initial Setup

```bash
# Clone the repository (if not already done)
git clone <your-repo-url>
cd pos-system

# Run the setup script
npm run setup
```

### 2. Environment Configuration

Update the `.env` file with your database credentials:

```env
# Database URLs
DATABASE_URL="file:./prisma/dev.db"
DATABASE_URL_ONLINE="postgresql://username:password@localhost:5432/pos_system"

# JWT Secret (change this in production!)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Server Port
PORT=3001

# Electron Environment
ELECTRON_IS_DEV=true
```

### 3. Database Setup

The setup script will automatically:
- Create SQLite database
- Generate Prisma clients
- Set up initial database schema

For PostgreSQL (online database), ensure your database server is running and accessible.

## 🎯 Development

### Start Development Mode

```bash
npm run electron
```

This will:
- Start Next.js development server
- Start Express API server
- Launch Electron application
- Enable hot reload

### Available Development Commands

```bash
# Start in development mode
npm run electron

# Build the application
npm run build-electron

# Lint code
npm run lint
```

## 📦 Building & Distribution

### Build for Development

```bash
npm run electron-build
```

### Create Distribution Packages

```bash
# Build for all platforms
npm run electron-dist

# Build for specific platform
npm run electron-dist-win    # Windows
npm run electron-dist-mac    # macOS
npm run electron-dist-linux  # Linux

# Or use the distribute script
npm run distribute [platform]
```

### Distribution Output

Built applications will be available in:
- `electron/dist/` - Distribution packages
- `out/` - Next.js static build
- `server/` - Express API server

## 🗄️ Database Architecture

### SQLite (Offline Database)
- Primary database for offline operations
- Located at `prisma/dev.db`
- Schema: `prisma/schema.prisma`
- Client: `@prisma/client/generated/offline`

### PostgreSQL (Online Database)
- Cloud/online database for sync
- Schema: `prisma/online.prisma`
- Client: `@prisma/client/generated/online`

### Sync System

The application includes a comprehensive sync system:

```javascript
// Sync from SQLite to PostgreSQL
POST /api/sync/to-online
{
  "table": "products", // or "all"
  "warehouseId": "optional"
}

// Sync from PostgreSQL to SQLite
POST /api/sync/to-offline
{
  "table": "products", // or "all"
  "warehouseId": "optional"
}

// Get sync status
GET /api/sync/status?warehouseId=optional
```

## 🔌 API Endpoints

The Express server provides full REST API:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify JWT token

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `PATCH /api/products/:id/quantity` - Update quantity

### Sales
- `GET /api/sales` - List sales
- `POST /api/sales` - Create sale
- `GET /api/sales/:id` - Get sale details
- `GET /api/sales/summary/dashboard` - Sales summary

### Customers, Suppliers, Warehouses, Users
- Full CRUD operations for all entities
- Similar endpoint patterns as products

### Settings
- `GET /api/settings` - Get application settings
- `PUT /api/settings` - Update settings
- `GET /api/settings/receipt/:warehouseId` - Get receipt settings

## 🔄 Auto-Updater

The application includes automatic update functionality:

### Setup for Auto-Updater

1. **GitHub Repository**: Ensure your code is in a GitHub repository
2. **Update electron/package.json**:
   ```json
   "publish": {
     "provider": "github",
     "owner": "yourusername",
     "repo": "pos-system"
   }
   ```
3. **GitHub Token**: Set up a GitHub token with repository permissions
4. **Releases**: Create releases with version tags (e.g., v1.0.0)

### How It Works

- Application checks for updates on startup
- Downloads updates in the background
- Prompts user to restart when update is ready
- Automatically installs and restarts

## 🏗️ Project Structure

```
pos-system/
├── app/                    # Next.js app directory
├── components/             # React components
├── electron/              # Electron main process
│   ├── main.js           # Main Electron process
│   ├── preload.js        # Preload script
│   ├── package.json      # Electron dependencies
│   └── assets/           # App icons
├── server/               # Express API server
│   ├── index.js         # Server entry point
│   ├── routes/          # API route handlers
│   └── package.json     # Server dependencies
├── prisma/              # Database schemas
│   ├── schema.prisma    # SQLite schema
│   ├── online.prisma    # PostgreSQL schema
│   └── dev.db          # SQLite database
├── scripts/             # Build and setup scripts
├── out/                 # Next.js build output
└── package.json         # Main dependencies
```

## 🚀 Deployment

### For End Users

1. **Download**: Users download the installer from your releases
2. **Install**: Standard OS installation process
3. **Run**: Application runs independently with embedded database

### For Updates

1. **Build**: Create new version with `npm run electron-dist`
2. **Release**: Upload to GitHub releases with version tag
3. **Auto-Update**: Users get automatic update notifications

## 🔧 Configuration

### Electron Configuration

Key settings in `electron/package.json`:

```json
{
  "build": {
    "appId": "com.yourcompany.pos-system",
    "productName": "POS System",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "../out/**/*",
      "../prisma/**/*"
    ]
  }
}
```

### Next.js Configuration

Optimized for Electron in `next.config.js`:

```javascript
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : ''
};
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check `.env` file configuration
   - Ensure database files exist
   - Verify Prisma client generation

2. **Build Failures**
   - Clear `node_modules` and reinstall
   - Check Node.js version compatibility
   - Verify all dependencies are installed

3. **Auto-Updater Issues**
   - Check GitHub repository configuration
   - Verify release tags and assets
   - Ensure proper permissions

### Development Debugging

```bash
# Enable Electron dev tools
# Dev tools open automatically in development mode

# Check server logs
# Server logs appear in the terminal where you started the app

# Database debugging
npx prisma studio --schema=prisma/schema.prisma
```

## 📝 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Happy coding! 🎉**