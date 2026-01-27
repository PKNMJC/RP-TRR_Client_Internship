# 📚 Implementation Guide - New Admin System

## 🎯 Quick Start

### Step 1: Replace the Admin Sidebar

**File:** `src/components/AdminSidebar.tsx` → Replace with `AdminSidebar-new.tsx`

```bash
# Backup old version
cp src/components/AdminSidebar.tsx src/components/AdminSidebar-old.tsx

# Use new version
cp src/components/AdminSidebar-new.tsx src/components/AdminSidebar.tsx
```

### Step 2: Update Admin Layout

**File:** `src/app/admin/layout.tsx` → Use `layout-new.tsx`

```tsx
import AdminSidebar from "../../components/AdminSidebar";
import "../../app/globals.css";

export const metadata = {
  title: "Admin Portal | TRR-RP",
  description: "ระบบจัดการแอดมิน",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex bg-slate-950 min-h-screen">
      <AdminSidebar />
      <main className="flex-1 lg:ml-64 lg:pt-0 pt-16 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 min-h-screen">
        <div className="p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
```

### Step 3: Copy New Pages

```bash
# Copy new pages to admin directory
cp src/app/admin/dashboard/page-new.tsx src/app/admin/dashboard/page.tsx
cp src/app/admin/delete-repairs/page.tsx src/app/admin/delete-repairs/page.tsx
cp src/app/admin/export-data/page.tsx src/app/admin/export-data/page.tsx
cp src/app/admin/backup/page.tsx src/app/admin/backup/page.tsx
```

### Step 4: Copy Modal Components

```bash
# Modal components
cp src/components/modals/AdminActionModals.tsx src/components/modals/AdminActionModals.tsx
```

---

## 🔧 Configuration

### Update Environment Variables

```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ADMIN_ROLE=ADMIN
```

### Update API Endpoints

**File:** `src/services/api.ts`

```typescript
export const adminAPI = {
  // Delete operations
  deleteRepair: (id: string, reason: string) =>
    api.delete(`/admin/repairs/${id}`, { data: { reason } }),

  deleteUser: (id: string, reason: string) =>
    api.delete(`/admin/users/${id}`, { data: { reason } }),

  // Export operations
  exportData: (type: string, format: string) =>
    api.get(`/admin/export/${type}?format=${format}`, {
      responseType: "blob",
    }),

  // Backup operations
  createBackup: () => api.post("/admin/backup/create"),

  restoreBackup: (backupId: string) =>
    api.post(`/admin/backup/${backupId}/restore`),

  getBackups: () => api.get("/admin/backups"),

  // Audit logs
  getAuditLogs: (filters?: any) =>
    api.get("/admin/audit-logs", { params: filters }),

  // Analytics
  getAnalytics: (dateRange?: any) =>
    api.get("/admin/analytics", { params: dateRange }),
};
```

---

## 📝 Backend API Requirements

### Delete Repair

```typescript
// POST /admin/repairs/{id}/delete
{
  reason: string; // Required
}

Response: {
  success: boolean;
  message: string;
  deletedAt: Date;
  logId: string; // Audit log ID
}
```

### Export Data

```typescript
// GET /admin/export/{type}?format={csv|json|pdf}
// Headers: Authorization required (ADMIN role)

// Types: repairs, users, loans, analytics, audit-logs

Response:
File stream with appropriate MIME type
```

### Create Backup

```typescript
// POST /admin/backup/create
{
  type?: "manual" | "automatic";
}

Response:
{
  id: string;
  name: string;
  size: string;
  createdAt: Date;
  status: "in-progress" | "completed" | "failed";
}
```

### Restore Backup

```typescript
// POST /admin/backup/{backupId}/restore
// Requires confirmation

Response: {
  success: boolean;
  message: string;
  restoredAt: Date;
  checksumVerified: boolean;
}
```

### Get Audit Logs

```typescript
// GET /admin/audit-logs
// Query params: userId, action, startDate, endDate, limit, offset

Response:
{
  logs: AuditLog[];
  total: number;
  page: number;
}

AuditLog {
  id: string;
  userId: number;
  userName: string;
  action: string;  // create, update, delete, login, logout
  entityType: string;  // repair, user, loan, etc
  entityId: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;  // For delete operations
  timestamp: Date;
  ipAddress: string;
}
```

---

## 🗄️ Database Schema Updates

### Add Audit Log Table

```prisma
model AuditLog {
  id        String   @id @default(cuid())
  userId    Int
  userName  String
  action    String   // create, update, delete, login, logout
  entityType String  // repair, user, loan, etc
  entityId  String
  oldValue  Json?
  newValue  Json?
  reason    String?  // For delete operations
  timestamp DateTime @default(now())
  ipAddress String?

  user      User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([action])
}
```

### Add Backup Records Table

```prisma
model Backup {
  id        String   @id @default(cuid())
  name      String
  size      String
  type      String   // automatic, manual
  status    String   // in-progress, completed, failed
  createdBy Int?
  createdAt DateTime @default(now())
  expiresAt DateTime?

  user      User?    @relation(fields: [createdBy], references: [id])

  @@index([createdAt])
  @@index([type])
}
```

### Update User Model for Soft Deletes

```prisma
model User {
  // ... existing fields ...
  deletedAt DateTime?  // Soft delete timestamp
  deletionReason String?
}
```

---

## 🔒 Security Implementation

### Authentication Middleware

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const adminRole = request.cookies.get("userRole")?.value;

  if (request.nextUrl.pathname.startsWith("/admin/")) {
    if (adminRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}
```

### Backend Authorization

```typescript
// src/auth/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only admins can access this resource');
    }

    return true;
  }
}

// Usage
@Delete('repairs/:id')
@UseGuards(AdminGuard)
async deleteRepair(@Param('id') id: string, @Body() body: DeleteRepairDto) {
  return this.adminService.deleteRepair(id, body.reason);
}
```

---

## 📊 Testing Checklist

### Unit Tests

```typescript
// __tests__/adminSidebar.test.tsx
describe("AdminSidebar", () => {
  it("should render all menu items", () => {
    // Test code
  });

  it("should expand/collapse menu items", () => {
    // Test code
  });
});
```

### Integration Tests

```typescript
// __tests__/deleteRepair.integration.test.tsx
describe("Delete Repair Feature", () => {
  it("should delete repair with valid reason", async () => {
    // Test code
  });

  it("should log deletion in audit trail", async () => {
    // Test code
  });
});
```

### E2E Tests

```typescript
// e2e/admin-dashboard.e2e.ts
describe("Admin Dashboard E2E", () => {
  it("should navigate to delete repairs page", () => {
    // Test code
  });

  it("should successfully delete repair", () => {
    // Test code
  });
});
```

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit passed
- [ ] Database migrations ready
- [ ] Backup system tested
- [ ] Documentation updated
- [ ] User training completed

### Deployment Steps

```bash
# 1. Backup current database
npm run backup:create

# 2. Run database migrations
npm run prisma:migrate deploy

# 3. Build frontend
npm run build

# 4. Deploy to staging
npm run deploy:staging

# 5. Run smoke tests
npm run test:e2e

# 6. Deploy to production
npm run deploy:production

# 7. Monitor logs
npm run logs:tail
```

### Post-Deployment

- [ ] Verify all features working
- [ ] Check audit logs for errors
- [ ] Monitor system performance
- [ ] Notify users of new features
- [ ] Gather feedback

---

## 📈 Performance Optimization

### Sidebar Component

```typescript
// Memoize sidebar to prevent re-renders
export default memo(AdminSidebar);

// Use lazy loading for sub-items
const SubMenu = lazy(() => import("./SubMenu"));
```

### Export Functionality

```typescript
// Stream large exports instead of loading in memory
async function exportLargeDataset(type: string) {
  const stream = fs.createReadStream(`exports/${type}.csv`);
  stream.pipe(response);
}
```

### Backup System

```typescript
// Background job for backups
const backupJob = new CronJob("0 2 * * *", () => {
  createBackupAsync(); // Non-blocking
});
```

---

## 🐛 Troubleshooting

### Issue: Modal not showing

```typescript
// Check if modal state is properly managed
const [isModalOpen, setIsModalOpen] = useState(false);

// Ensure modal component is imported
import { DeleteRepairModal } from "../components/modals/AdminActionModals";
```

### Issue: Export failing

```typescript
// Check API response
console.log("Export response:", response.headers["content-type"]);

// Ensure correct blob handling
const blob = new Blob([data], { type: "text/csv" });
```

### Issue: Sidebar not expanding

```typescript
// Check expandedMenu state
console.log("Expanded menu:", expandedMenu);

// Verify toggleSubMenu function
const toggleSubMenu = useCallback((label: string) => {
  setExpandedMenu((prev) => (prev === label ? null : label));
}, []);
```

---

## 📚 Additional Resources

### Related Files

- [NEW_ADMIN_SYSTEM.md](./NEW_ADMIN_SYSTEM.md) - System overview
- [ADMIN_VS_IT_COMPARISON.md](./ADMIN_VS_IT_COMPARISON.md) - Feature comparison

### External Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)

---

## 💬 Support & Feedback

For questions or issues during implementation:

- Create an issue in the project repository
- Contact the development team
- Check existing documentation

---

**Last Updated:** January 27, 2025
**Version:** 1.0
**Status:** Ready for Implementation
