# Automatic Sync System Setup Guide

This guide explains how to set up and use the automatic sync system that synchronizes your offline SQLite database with an online database when you're connected to the internet.

## Overview

The sync system provides:
- **Automatic sync** when you come online
- **Periodic sync** while online (every 30 seconds by default)
- **Manual sync trigger** for immediate synchronization
- **Sync status tracking** for all database models
- **Error handling** and notifications
- **Offline-first** approach with graceful degradation

## Features

✅ **Auto-detection** of online/offline status  
✅ **Automatic sync** when connection is restored  
✅ **Sync status** tracking for all models  
✅ **Manual sync trigger** for immediate push  
✅ **Error handling** with detailed logging  
✅ **Progress tracking** and notifications  
✅ **Conflict resolution** via upsert operations  
✅ **Secure API** with authentication  

## Setup Instructions

### 1. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Database URLs
DATABASE_URL="file:./dev.db"                    # Your offline SQLite database
ONLINE_DATABASE_URL="postgresql://user:pass@host:port/db"  # Your online database

# Sync Configuration  
ONLINE_API_URL="https://your-online-api.com"    # Your online API endpoint
SYNC_API_KEY="your-secure-api-key-here"         # Secure API key for authentication

# Database Provider (postgresql or mysql)
ONLINE_DB_PROVIDER="postgresql"
```

### 2. Database Setup

The system automatically adds `sync` and `syncedAt` fields to all your models:

```prisma
model YourModel {
  id       String    @id @default(uuid())
  // ... your existing fields
  sync     Boolean   @default(false)  // Auto-added
  syncedAt DateTime?                  // Auto-added
}
```

### 3. Online Database Setup

Set up your online database (PostgreSQL or MySQL) with the same schema as your offline database, but without the `sync` and `syncedAt` fields.

## Usage

### Basic Usage

The sync system is automatically active once you wrap your app with the `SyncProvider` (already done in `app/layout.tsx`).

### Using the Sync Hook

```tsx
import { useSync } from '@/components/sync-provider'

function MyComponent() {
  const { online, isSyncing, triggerSync, lastSyncResult } = useSync()
  
  return (
    <div>
      <p>Status: {online ? 'Online' : 'Offline'}</p>
      <p>Syncing: {isSyncing ? 'Yes' : 'No'}</p>
      <button onClick={triggerSync}>Sync Now</button>
    </div>
  )
}
```

### Adding Sync Status to Your UI

```tsx
import { SyncStatus } from '@/components/sync-status'

function Dashboard() {
  return (
    <div>
      {/* Compact version for navbar */}
      <SyncStatus compact />
      
      {/* Full version with details */}
      <SyncStatus showDetails />
    </div>
  )
}
```

### Using Sync-Aware Database Operations

Replace regular Prisma operations with sync-aware ones:

```tsx
import { 
  createWithSync, 
  updateWithSync, 
  prisma 
} from '@/lib/prisma-helpers'

// Instead of: prisma.product.create({ data: productData })
const product = await createWithSync('Product', productData)

// Instead of: prisma.product.update({ where: { id }, data: updateData })
const updated = await updateWithSync('Product', { id }, updateData)

// Read operations remain the same
const products = await prisma.product.findMany()
```

## API Endpoints

The system creates API endpoints at `/api/sync/[model]` for each model:

- `POST /api/sync/products` - Sync product data
- `POST /api/sync/sales` - Sync sales data
- `GET /api/sync/products` - Get online product count

## How It Works

### 1. Offline Operation
- All data is stored locally in SQLite
- New records have `sync: false`
- App works normally without internet

### 2. Online Detection
- System continuously checks online status
- Uses configurable ping endpoint
- Triggers sync when connection restored

### 3. Sync Process
- Finds all unsynced records (`sync: false`)
- Pushes data to online API endpoints
- Marks records as synced (`sync: true, syncedAt: timestamp`)
- Handles errors gracefully

### 4. Conflict Resolution
- Uses `upsert` operations for conflict resolution
- Online database takes precedence
- Detailed error logging for manual review

## Configuration Options

### SyncProvider Options

```tsx
<SyncProvider
  enableAutoSync={true}      // Enable/disable auto sync
  syncInterval={30000}       // Sync interval in ms (30 seconds)
  showNotifications={true}   // Show toast notifications
>
  {children}
</SyncProvider>
```

### Online Status Check

```tsx
import { useOnlineStatus } from '@/hooks/check-online'

const { online, loading } = useOnlineStatus(
  'https://your-ping-endpoint.com',  // Custom ping URL
  5000                               // Check interval (ms)
)
```

## Models Included

The sync system works with all your models:
- `superAdmin`
- `users`
- `Settings`
- `Warehouses`
- `Sale`
- `Customer`
- `SaleItem`
- `Product`
- `PaymentMethod`

## Error Handling

### Common Issues

1. **Network Errors**: Retried automatically
2. **API Key Issues**: Check `SYNC_API_KEY` configuration
3. **Database Errors**: Logged for manual review
4. **Schema Mismatches**: Ensure online DB schema matches

### Debugging

Check browser console for detailed sync logs:
```javascript
// Enable debug logging
localStorage.setItem('sync-debug', 'true')
```

## Security

- API endpoints require authentication via `SYNC_API_KEY`
- Data is transmitted over HTTPS
- Sync fields (`sync`, `syncedAt`) are stripped before sending to online DB
- No sensitive data is logged

## Performance

- Sync runs in background without blocking UI
- Only unsynced records are transmitted
- Configurable sync intervals
- Progress tracking for large datasets

## Testing

```bash
# Generate test data
npm run seed

# Reset sync status (mark all as unsynced)
# Use the sync component's reset function

# Monitor sync in development
# Check browser console for detailed logs
```

## Troubleshooting

### Sync Not Working?

1. Check internet connection
2. Verify environment variables
3. Check API key authentication
4. Review browser console for errors
5. Ensure online database is accessible

### Reset Sync Status

```tsx
import { syncService } from '@/lib/sync-service'

// Mark all records as unsynced
await syncService.resetSyncStatus()
```

### Manual Sync

```tsx
import { useSync } from '@/components/sync-provider'

const { triggerSync } = useSync()
await triggerSync()
```

## Next Steps

1. Set up your online database
2. Configure environment variables
3. Test with sample data
4. Monitor sync logs
5. Customize UI components as needed

The sync system is now ready to automatically keep your offline and online databases in sync! 🚀