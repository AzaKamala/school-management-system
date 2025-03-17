# Multi-Tenant School Management System

This project is a backend API for a multi-tenant school management system with role-based access control and event-driven architecture.

## Features

- **Multi-Tenant Architecture**: Separate database per tenant (school)
- **Role-Based Access Control**: Super Admins, Tenant Admins, and Students
- **JWT Authentication**: Secure access and refresh tokens
- **OAuth2 Support**: Login with Google
- **Audit Logging**: Track login attempts in a separate table per tenant
- **Event-Driven Architecture**: Login events processed by a background worker
- **Rate Limiting**: Protection against brute force attacks

## Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (v16+)
- **PostgreSQL** (v14+)
- **RabbitMQ**

## Installation & Setup

### 1. Clone the Repository

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create an `.env` file by copying the example:

```bash
cp .env.example .env
```

Update the PostgreSQL connection details in the `.env` file:

```
# Main admin database
DATABASE_URL="postgresql://{username}:{password}@localhost:5432/school_management"

# Prefix for tenant databases 
DATABASE_URL_PREFIX="postgresql://{username}:{password}@localhost:5432/"

# JWT Secrets
ACCESS_TOKEN_SECRET="your-access-token-secret"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"

# RabbitMQ (optional)
RABBITMQ_URL="amqp://localhost"
```

### 4. Generate Prisma Clients

```bash
npm run generate
```

### 5. Initialize Database

Create a PostgreSQL database named `school_management`, then run:

```bash
npm run init:db
```

This will:
- Set up the admin database schema
- Create default permissions and roles
- Create a super admin user
- Create a test tenant with demo users

### 6. Start the Application

Development mode:

```bash
npm run dev
```

Start with the audit log worker:

```bash
npm run dev:worker
```

## Default Users

After initialization, you can log in with these credentials:

### Super Admin
- Email: admin@schoolsystem.com
- Password: SuperAdmin123!

### Tenant Admin (Test School)
- Email: admin@email.com
- Password: TenantAdmin123!

## API Endpoints

### Authentication

- `POST /auth/login` - Login with email and password
- `POST /auth/refresh-token` - Refresh JWT token
- `POST /auth/logout` - Logout (revoke refresh token)
- `GET /auth/oauth/google` - Initiate Google OAuth login
- `GET /auth/oauth/google/callback` - Google OAuth callback

### Tenant Management (Super Admin only)

- `GET /tenant` - List all tenants
- `GET /tenant/:id` - Get tenant details
- `POST /tenant` - Create a new tenant
- `PUT /tenant/:id` - Update tenant
- `DELETE /tenant/:id` - Delete tenant

### User Management

- `GET /tenant/:tenantId/user` - List all users in a tenant
- `GET /tenant/:tenantId/user/:id` - Get user details
- `POST /tenant/:tenantId/user` - Create a new user
- `PUT /tenant/:tenantId/user/:id` - Update user
- `DELETE /tenant/:tenantId/user/:id` - Delete user

### Role Management

- `GET /tenant/:tenantId/user/:id/roles` - Get user roles
- `POST /tenant/:tenantId/user/:id/roles` - Assign role to user
- `DELETE /tenant/:tenantId/user/:id/roles/:roleId` - Remove role from user

### Audit Logs

- `GET /tenant/:tenantId/audit` - Get audit logs for a tenant
- `GET /audit/admin` - Get admin audit logs (Super Admin only)

## Project Structure

- `src/` - Source code
  - `admin/` - Admin user and tenant management
  - `audit/` - Audit logging functionality
  - `auth/` - Authentication and OAuth
  - `common/` - Shared middleware and utilities
  - `tenant/` - Tenant-specific functionality
  - `utils/` - Utility functions
- `prisma/` - Prisma schema definitions
  - `admin.prisma` - Admin database schema
  - `tenant.prisma` - Tenant database schema

## Multi-Tenancy

This system uses a database-per-tenant architecture:
- Each school (tenant) has its own isolated PostgreSQL database
- The main `school_management` database stores tenant information and global admin users
- When a tenant is created, a new database is automatically provisioned

## Authentication & Authorization

- JWT tokens are used for API authentication
- Access tokens are short-lived (15 minutes)
- Refresh tokens are long-lived (5 days) and stored in the database
- Users can have multiple roles, each with associated permissions
- API endpoints check for specific permissions

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:
1. Make sure PostgreSQL is running
2. Verify database credentials in your `.env` file
3. Ensure your PostgreSQL user has permission to create databases

### RabbitMQ Issues

If audit logging isn't working:
1. Verify RabbitMQ is running
2. Check the RabbitMQ URL in your `.env` file

### Prisma Issues

If you encounter errors about Prisma not finding model names:
1. Run `npm run generate` again to regenerate the Prisma client

## Testing with Postman

A Postman collection named `School Management System API.postman_collection.json` can be found in the root directory of the project with sample API requests.