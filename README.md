# 📦 Product Inventory Management System

A comprehensive inventory management application built with Next.js and Prisma ORM.

## Features

- **Product Management**: Create, read, update, and delete products with detailed attributes

  - Category tracking
  - Organic certification flag
  - Storefront visibility toggle
  - Unit of measurement
  - Cost per unit
  - Minimum stock levels
  - Source/supplier tracking

- **Customer Management**: Maintain customer records with email

  - Add and manage customers
  - Track sales per customer

- **Inventory Tracking**: Monitor product inventory

  - Record received inventory with quantities and dates
  - Upload receipt URLs
  - Track inventory history

- **Sales Management**: Record and track product sales

  - Sales per customer type
  - Apply markup percentages to calculate customer pricing
  - Track cost and sale prices
  - Detailed sales history

- **Dashboard**: Overview of all operations
  - Key metrics (products, customers, sales, revenue)
  - Low stock alerts
  - Recent sales and inventory received

## Tech Stack

- **Frontend**: Next.js 15+ with React
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Styling**: Tailwind CSS
- **Type Safety**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

### Installation

1. Install dependencies:

```bash
npm install
```

2. Initialize the database:

```bash
npx prisma migrate dev
```

This will create the SQLite database and run all migrations.

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. You'll be redirected to the dashboard.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── customers/       # Customer CRUD endpoints
│   │   ├── products/        # Product CRUD endpoints
│   │   ├── inventory/       # Inventory received CRUD endpoints
│   │   └── sales/           # Sales CRUD endpoints
│   ├── dashboard/           # UI Pages
│   │   ├── page.tsx         # Dashboard home
│   │   ├── products/        # Products page
│   │   ├── customers/       # Customers page
│   │   ├── inventory/       # Inventory page
│   │   └── sales/           # Sales page
│   └── page.tsx             # Redirects to dashboard
├── components/
│   ├── Navbar.tsx           # Navigation bar
│   ├── UI.tsx              # Reusable UI components
│   └── index.ts            # Component exports
├── lib/
│   └── prisma.ts           # Prisma client singleton
├── types/
│   └── index.ts            # TypeScript type definitions
└── generated/
    └── prisma/             # Prisma client (auto-generated)

prisma/
├── schema.prisma           # Database schema
└── migrations/             # Migration files
```

## Database Schema

### Customer

- `id`: Primary key
- `name`: Customer name
- `email`: Unique email address
- `createdAt`, `updatedAt`: Timestamps

### Product

- `id`: Primary key
- `name`: Product name
- `category`: Product category
- `isOrganic`: Boolean flag
- `showInStorefront`: Visibility flag
- `unitOfMeasurement`: e.g., "kg", "lbs", "units"
- `pricePerUnit`: Cost price
- `minimumStock`: Minimum quantity to maintain
- `source`: Where product is sourced from
- `createdAt`, `updatedAt`: Timestamps

### InventoryReceived

- `id`: Primary key
- `productId`: Foreign key to Product
- `quantity`: Quantity received
- `receivedDate`: Date of receipt
- `receiptUrl`: Optional URL to receipt document
- `createdAt`, `updatedAt`: Timestamps

### Sale

- `id`: Primary key
- `customerId`: Foreign key to Customer
- `saleDate`: Date of sale
- `totalCost`: Total cost to procure
- `totalPrice`: Total charged to customer
- `markupPercent`: Markup percentage applied
- `createdAt`, `updatedAt`: Timestamps

### SaleItem

- `id`: Primary key
- `saleId`: Foreign key to Sale
- `productId`: Foreign key to Product
- `quantity`: Quantity sold
- `costPrice`: Cost per unit at time of sale
- `salePrice`: Sale price per unit
- `createdAt`, `updatedAt`: Timestamps

## API Endpoints

### Customers

- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `GET /api/customers/:id` - Get single customer
- `PUT /api/customers/:id` - Update customer
- `DELETE /api/customers/:id` - Delete customer

### Products

- `GET /api/products` - List all products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get single product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Inventory

- `GET /api/inventory` - List all inventory received
- `POST /api/inventory` - Record new inventory
- `GET /api/inventory/:id` - Get single inventory entry
- `PUT /api/inventory/:id` - Update inventory entry
- `DELETE /api/inventory/:id` - Delete inventory entry

### Sales

- `GET /api/sales` - List all sales
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get single sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

## Features Implemented

### CRUD Operations

All entities support full CRUD operations:

- ✅ Create new records
- ✅ Read/List records
- ✅ Update existing records
- ✅ Delete records

### Business Logic

- ✅ Automatic markup calculation on sales
- ✅ Cost and revenue tracking
- ✅ Low stock alerts on dashboard
- ✅ Receipt URL attachment for inventory

### UI Components

- ✅ Dashboard with key metrics
- ✅ Modal dialogs for forms
- ✅ Data tables with edit/delete actions
- ✅ Navigation between sections
- ✅ Responsive design with Tailwind CSS
- ✅ Type-safe component props

## Development Notes

### Type Safety

The codebase uses TypeScript throughout with proper type definitions. Prisma errors are handled with type checking to avoid `any` type casting.

### Database Migrations

Any schema changes should be done through Prisma migrations:

```bash
npx prisma migrate dev --name <migration_name>
```

### Prisma Studio

View and edit database records with Prisma Studio:

```bash
npx prisma studio
```

## Future Enhancements

- User authentication and authorization
- Advanced inventory analytics
- Bulk import/export
- Customer types and pricing tiers
- Inventory forecasting
- Email notifications for low stock
- Role-based access control
- Payment integration
- Barcode scanning
- Multiple warehouse support

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
