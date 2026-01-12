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

- Advanced inventory analytics
- Bulk import/export
- Customer types and pricing tiers
- Inventory forecasting
- Email notifications for low stock
- Role-based access control
- Payment integration
- Barcode scanning

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
