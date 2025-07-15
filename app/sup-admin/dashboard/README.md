# Super Admin Dashboard

A fully functional super admin dashboard built with Next.js, Prisma, and TailwindCSS that provides comprehensive management capabilities for your warehouse management system.

## Features

### 📊 Dashboard Overview
- **Real-time Statistics**: Live data from your Prisma database
  - Total Users, Warehouses, Products, Sales, Customers
  - Total Revenue tracking
  - Real-time recent sales feed

### 👥 User Management
- **Complete User CRUD Operations**
  - View all users with pagination
  - Search users by username or email
  - Delete users with confirmation
  - Role-based user categorization (admin, sales, purchase)
  - User activity tracking (last login)

### 🏗️ Architecture
- **Database Integration**: Connected to Prisma with SQLite backend
- **API Routes**: Server-side data fetching with proper error handling
- **Component-based**: Modular, reusable React components
- **Responsive Design**: Mobile-first TailwindCSS styling

## File Structure

```
app/sup-admin/dashboard/
├── page.tsx                    # Main dashboard page
├── users/
│   └── page.tsx               # Dedicated user management page
├── components/
│   ├── DashboardCard.tsx      # Reusable metric cards
│   ├── RecentSalesTable.tsx   # Sales data display
│   ├── UserTable.tsx          # User management with search/pagination
│   ├── QuickActions.tsx       # Navigation shortcuts
│   └── SystemOverview.tsx     # System health monitoring
└── README.md                  # This documentation

API Routes:
├── app/api/dashboard/stats/route.ts    # Dashboard statistics
└── app/api/users/route.ts              # User management operations

Database:
└── lib/prisma.ts                       # Prisma client configuration
```

## Database Schema Integration

The dashboard integrates with your existing Prisma schema:

### Key Models Used:
- **`users`**: System users with roles and warehouse assignments
- **`superAdmin`**: Super admin accounts
- **`Warehouses`**: Warehouse locations and management
- **`Product`**: Product inventory
- **`Sale`**: Sales transactions
- **`Customer`**: Customer database
- **`Settings`**: System configuration

## Components

### DashboardCard
Reusable metric display component with:
- Icon support
- Trend indicators
- Formatted number display
- Customizable descriptions

### UserTable
Advanced user management with:
- Server-side pagination (10 users per page)
- Real-time search functionality
- Role-based badge styling
- Secure delete operations
- Last login tracking

### RecentSalesTable
Sales activity display featuring:
- Recent transaction history
- Customer information
- Product details
- Invoice tracking
- Amount formatting

### SystemOverview
System monitoring component showing:
- Database health status
- Server performance metrics
- Network connectivity
- Storage usage

## API Routes

### Dashboard Statistics (`/api/dashboard/stats`)
```typescript
GET /api/dashboard/stats
Returns:
{
  totalUsers: number,
  totalWarehouses: number,
  totalProducts: number,
  totalSales: number,
  totalCustomers: number,
  totalRevenue: number,
  recentSales: RecentSale[]
}
```

### User Management (`/api/users`)
```typescript
GET /api/users?page=1&limit=10&search=query
Returns: { users: User[], pagination: PaginationInfo }

DELETE /api/users?id=userId
Returns: { success: boolean }
```

## Usage

### Accessing the Dashboard
Navigate to `/sup-admin/dashboard` (requires super admin authentication)

### User Management
1. **View Users**: Dashboard displays a comprehensive user table
2. **Search Users**: Use the search bar to filter by username or email
3. **Delete Users**: Click the trash icon to remove users (with confirmation)
4. **Pagination**: Navigate through user pages using Previous/Next buttons

### Quick Actions
The dashboard provides shortcuts to:
- Manage Warehouses
- View All Users
- Manage Products
- Access Reports
- System Settings

## Customization

### Adding New Metrics
1. Update the API route in `app/api/dashboard/stats/route.ts`
2. Add new `DashboardCard` components in the main dashboard
3. Update the TypeScript interface for type safety

### Modifying User Table
The `UserTable` component can be extended with:
- Additional user fields
- Custom filtering options
- Bulk operations
- Export functionality

### Database Schema Adjustments
If your Prisma schema differs:
1. Update the Prisma queries in API routes
2. Modify TypeScript interfaces
3. Adjust component props accordingly

## Security Features

- **Authentication Required**: Super admin role verification
- **Secure API Routes**: Proper error handling and validation
- **Confirmation Dialogs**: Prevent accidental data deletion
- **Input Sanitization**: Search queries properly escaped

## Performance Optimizations

- **Server-side Pagination**: Efficient data loading
- **Parallel API Calls**: Simultaneous data fetching
- **Component Lazy Loading**: Improved initial load times
- **Database Indexing**: Optimized Prisma queries

## Styling

- **TailwindCSS**: Utility-first styling approach
- **shadcn/ui**: Consistent component library
- **Responsive Design**: Mobile and desktop optimized
- **Dark/Light Mode**: Follows system preferences

## Future Enhancements

Potential improvements:
- Real-time updates with WebSockets
- Advanced filtering and sorting
- Bulk user operations
- Data export functionality
- Activity logging and audit trails
- Advanced analytics and reporting

## Environment Variables

Ensure these are set in your `.env` file:
```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
```

## Running the Dashboard

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev
```

Navigate to `http://localhost:3000/sup-admin/dashboard`