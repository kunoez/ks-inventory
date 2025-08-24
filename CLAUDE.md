# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KOI (Koch Inventory) is a comprehensive IT inventory management system with a Next.js 15 frontend and NestJS backend. The application manages company assets including devices, software licenses, phone contracts, and employee assignments with Azure AD integration for authentication.

## Development Commands

### Frontend (inventory-system-frontend/)
```bash
npm install              # Install dependencies
npm run dev              # Run development server (default port 3000)
PORT=3001 npm run dev    # Run on alternative port
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run linting
```

### Backend (inventory-system-backend/)
```bash
npm install              # Install dependencies
npm run start:dev        # Run development server with watch mode (port 3002)
npm run start:prod       # Run production server
npm run build            # Build for production
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run test             # Run unit tests
npm run test:watch       # Run tests in watch mode
npm run test:cov         # Run tests with coverage
npm run test:e2e         # Run end-to-end tests
npm run seed             # Seed database with sample data
```

## Database Setup

The system uses Microsoft SQL Server (MSSQL) via Docker:

```bash
# Start MSSQL Server
docker run -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=YourStrong@Passw0rd" \
  -p 1433:1433 --name koch-mssql -d \
  mcr.microsoft.com/mssql/server:2022-latest

# Database connection details:
# Host: localhost, Port: 1433, Username: sa, Password: YourStrong@Passw0rd
# Database: inventory_system (auto-created by TypeORM)
```

## Architecture & Key Patterns

### Backend (NestJS + TypeORM)

**Core Modules:**
- **Auth Module**: Azure AD integration with MSAL, JWT tokens, role-based access control
- **Entity Modules**: Devices, Employees, Licenses, PhoneContracts, Companies, Assignments
- **Notification System**: Real-time notifications for system events
- **Report Module**: Data analytics and export functionality

**Critical DTOs and Validation:**
- `UpdateEmployeeDto` excludes `companyId` and `employeeId` from updates
- `UpdateDeviceDto` excludes `companyId` and `serialNumber` from updates
- `UpdateLicenseDto` excludes `companyId` from updates
- All DTOs use class-validator for input validation

**TypeORM Considerations:**
- MSSQL compatibility is critical - avoid unsupported data types
- Soft deletes implemented via `@DeleteDateColumn()`
- Relations use eager/lazy loading patterns
- Company-scoped queries filter all entities by companyId

### Frontend (Next.js + TypeScript)

**API Integration:**
- `lib/api-client.ts`: Axios client with JWT interceptors and token refresh
- `lib/data-service.ts`: Service layer wrapping API calls with error handling
- All async operations must be properly awaited for table refreshes

**Component Patterns:**
- Form components must handle edit vs create modes differently (exclude non-updatable fields)
- Date inputs require YYYY-MM-DD format conversion
- Select components cannot use empty string values (use "no-company" instead)
- Toast notifications via `useToast` hook for all CRUD operations

**State Management:**
- Auth context (`contexts/auth-context.tsx`) manages user session
- Company context tracks current company selection
- No global state management - component-level state with prop drilling

## Common Issues & Solutions

### Form Validation Errors (400 Bad Request)
- Check if sending excluded fields during updates (companyId, serialNumber, employeeId)
- Ensure dates are in ISO format
- Verify required fields are present

### Select Component Errors
- Never use empty string "" as SelectItem value
- Use semantic values like "no-company" and handle in submission

### Table Refresh Issues
- Always await async service calls before calling loadData functions
- Use proper error handling with try/catch blocks

### MSSQL Type Errors
- Avoid array types, JSON columns, and other PostgreSQL-specific features
- Use string enums instead of native enum types
- Handle boolean as bit type in MSSQL

## Entity Relationships

- **Companies** → one-to-many → Employees, Devices, Licenses, PhoneContracts
- **Employees** → one-to-many → DeviceAssignments, LicenseAssignments, PhoneContractAssignments
- **Devices/Licenses/PhoneContracts** → one-to-many → respective Assignment entities
- All entities are company-scoped (filtered by companyId in queries)

## Authentication Flow

1. User logs in via Azure AD (MSAL PKCE flow) or local credentials
2. Backend validates and returns JWT tokens (access + refresh)
3. Frontend stores tokens in localStorage and includes in all API requests
4. Token refresh handled automatically by axios interceptors
5. Protected routes check user roles (admin, manager, user)
6. Azure AD redirect URI: http://localhost:3000/auth/callback (update for production)

## Testing Approach

- Backend: Jest for unit tests, Supertest for e2e tests
- Frontend: Component testing with React Testing Library (when implemented)
- Manual testing: Use seed data for consistent test scenarios

## German Localization

- Phone carriers: Vodafone, Telekom, O2, 1&1
- Date formats: Consider German format (DD.MM.YYYY) for display
- Currency: EUR for financial calculations

## Recent Implementations & Key Features

### Notification System
- Real-time notifications for license expiry, new assets, assignments
- Company-wide notifications when new resources are added
- Mark all as read functionality (PATCH /notifications/mark-all-read returns 200 with success message)
- Daily cron job at 9 AM checking for expiring licenses

### User Management
- Full CRUD operations for user accounts
- Role-based permissions (Admin, Manager, User)
- Azure AD sync capabilities for employee data
- Multi-company support with selectedCompanyIds

### Dashboard
- Real-time statistics for devices, licenses, employees
- Resource utilization charts (Recharts)
- Expiring license alerts
- Recent activity feed

## Environment Variables

### Backend (.env)
```
DATABASE_HOST=localhost
DATABASE_PORT=1433
DATABASE_USER=sa
DATABASE_PASSWORD=YourStrong@Passw0rd
DATABASE_NAME=inventory_system
JWT_SECRET=your-secret-key
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
AZURE_TENANT_ID=your-tenant-id
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3002/api/v1
NEXT_PUBLIC_AZURE_TENANT_ID=your-tenant-id
NEXT_PUBLIC_AZURE_CLIENT_ID=your-client-id
```