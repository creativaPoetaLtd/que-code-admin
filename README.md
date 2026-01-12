# QiewCode Admin Portal

🔒 **Secure Administrative Interface for QiewCode Platform**

## Overview

This is the **separate admin portal** for QiewCode, implementing security best practices by completely isolating administrative functions from the user portal.

### Architecture

```
User Portal    → app.qiewcode.com  (port 3000) → /api/v1/user/*
Admin Portal   → admin.qiewcode.com (port 3001) → /api/v1/admin/*
```

### Security Features

✅ **Complete Separation**
- Separate authentication endpoints
- Different JWT secrets
- Isolated localStorage/cookies
- No shared state with user portal

✅ **Access Control**
- Admin-only routes protected by middleware
- Role-based permissions
- Token validation on every request

✅ **Compliance Ready**
- PCI-DSS compliant architecture
- GDPR privacy segmentation
- Audit logging ready
- Zero-trust security model

## Getting Started

### Installation

```bash
cd que_code_admin
pnpm install
```

### Development

```bash
pnpm dev
```

Runs on **http://localhost:3001**

### Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_APP_NAME=QiewCode Admin Portal
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1/admin
NEXT_PUBLIC_USER_PORTAL_URL=http://localhost:3000
NEXT_PUBLIC_ADMIN_TOKEN_KEY=qc_admin_token
```

## Features

### Admin Dashboard
- System overview and metrics
- Real-time statistics
- Quick actions

### User Management
- View all users
- Approve/suspend accounts
- Assign roles
- KYC verification

### Roles & Permissions
- Create and manage roles
- Define permissions
- Assign user roles

### Security & Compliance
- Audit logs
- Security settings
- KYC/AML management

### Platform Management
- Transactions monitoring
- Organizations management
- Wallet restrictions
- Dispute resolution

## Authentication

### Admin Login
- Uses `/api/v1/admin/auth/login` endpoint
- Returns admin-specific JWT token
- Token stored in `qc_admin_token` (separate from user)

### Token Structure
```typescript
{
  adminId: string,
  role: "admin" | "super_admin",
  type: "admin",  // Important flag
  permissions: string[]
}
```

## Project Structure

```
src/
├── app/
│   ├── auth/login/      # Admin login page
│   ├── dashboard/       # Main admin dashboard
│   └── layout.tsx       # Root layout with AdminAuthProvider
├── components/
│   ├── admin/          # Admin-specific components
│   │   ├── AdminDashboard.tsx
│   │   ├── sections/   # Dashboard sections
│   │   └── modals/     # Admin modals
│   └── ui/             # Shared UI components
├── context/
│   └── AdminAuthContext.tsx  # Admin authentication
├── services/
│   └── adminService.ts      # Admin API calls
├── types/
│   └── admin.types.ts       # TypeScript types
└── utils/
    └── baseUrl.ts           # API configuration
```

## Deployment

### Production Build

```bash
pnpm build
pnpm start
```

### Domain Setup

Deploy to `admin.qiewcode.com` (separate subdomain)

### Environment (Production)

```env
NEXT_PUBLIC_API_URL=https://api.qiewcode.com/api/v1/admin
NEXT_PUBLIC_USER_PORTAL_URL=https://app.qiewcode.com
```

## Security Notes

⚠️ **NEVER** merge admin and user portals
⚠️ **ALWAYS** use separate authentication
⚠️ **VERIFY** admin role on every backend request
⚠️ **AUDIT** all admin actions

## Related Projects

- **User Portal**: `que_code_fn` (port 3000)
- **Backend API**: `que_code_bn` (port 5000)

## License

Private - QiewCode Platform
# que-code-admin
