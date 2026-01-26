# Quick Reference - Component Usage

## 🎯 Dialog System (Universal Modal)

### Success Dialog

```tsx
import { useDialog } from "@/components/Dialog";

export default function MyPage() {
  const { openDialog } = useDialog();

  const handleSuccess = () => {
    openDialog({
      type: "success",
      title: "บันทึกสำเร็จ",
      message: "ข้อมูลถูกบันทึกแล้ว",
      confirmText: "ตกลง",
      onConfirm: () => console.log("Done"),
    });
  };

  return <button onClick={handleSuccess}>Save</button>;
}
```

### Confirmation Dialog

```tsx
const { openDialog } = useDialog();

openDialog({
  type: "warning",
  title: "ยืนยันการลบ",
  message: "คุณแน่ใจว่าต้องการลบรายการนี้?",
  isDanger: true,
  confirmText: "ลบ",
  cancelText: "ยกเลิก",
  onConfirm: async () => {
    await deleteItem();
  },
});
```

## 📋 Forms

### FormModal - Universal Form

```tsx
import { FormModal } from "@/components";

<FormModal
  isOpen={isOpen}
  title="เพิ่มผู้ใช้"
  fields={[
    {
      name: "name",
      label: "ชื่อ-นามสกุล",
      type: "text",
      required: true,
      placeholder: "เช่น นายสมชาย",
    },
    {
      name: "email",
      label: "อีเมล",
      type: "email",
      required: true,
    },
    {
      name: "role",
      label: "บทบาท",
      type: "select",
      options: [
        { label: "ผู้ดูแล", value: "ADMIN" },
        { label: "ผู้ใช้", value: "USER" },
      ],
    },
  ]}
  onSubmit={async (data) => {
    await api.post("/users", data);
  }}
  onCancel={() => setIsOpen(false)}
/>;
```

### UserModal

```tsx
import { UserModal } from "@/components";

<UserModal
  user={selectedUser}
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSave={async (data) => {
    await userService.updateUser(selectedUser.id, data);
  }}
/>;
```

## 📊 Data Display

### DataTable

```tsx
import { DataTable, RoleBadge } from "@/components";

<DataTable
  columns={[
    { key: "name", label: "ชื่อ", width: "200px" },
    { key: "email", label: "อีเมล" },
    {
      key: "role",
      label: "บทบาท",
      render: (value) => <RoleBadge role={value} />,
    },
  ]}
  data={users}
  isLoading={loading}
  onEdit={(user) => handleEdit(user)}
  onDelete={(user) => handleDelete(user)}
  onView={(user) => handleView(user)}
/>;
```

### SearchBox

```tsx
import { SearchBox } from "@/components";

<SearchBox
  placeholder="ค้นหาผู้ใช้..."
  onSearch={(query) => setSearchQuery(query)}
  debounceMs={300}
/>;
```

### Pagination

```tsx
import { Pagination } from "@/components";

<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={10}
  onPageChange={(page) => setCurrentPage(page)}
/>;
```

## 🔔 Notifications

### Using Hook

```tsx
import { useNotifications } from "@/hooks";

export default function MyPage() {
  const { success, error, warning, info } = useNotifications();

  const handleSave = async () => {
    try {
      await api.post("/data", formData);
      success("บันทึกสำเร็จ", "ข้อมูลถูกเพิ่มแล้ว");
    } catch (e) {
      error("เกิดข้อผิดพลาด", e.message);
    }
  };

  return <button onClick={handleSave}>Save</button>;
}
```

### Notification Container

```tsx
import { NotificationContainer } from "@/components";
import { useNotifications } from "@/hooks";

export default function Layout({ children }) {
  const { notifications, removeNotification } = useNotifications();

  return (
    <>
      {children}
      <NotificationContainer
        notifications={notifications}
        onRemove={removeNotification}
      />
    </>
  );
}
```

## 🎨 Badges & Status

### Role Badge

```tsx
import { RoleBadge } from "@/components";

<RoleBadge role="ADMIN" />;
// Output: ผู้ดูแลระบบ with admin badge
```

### Status Badge

```tsx
import { StatusBadge } from "@/components";

<StatusBadge status="COMPLETED" />;
// Output: เสร็จสิ้น with success badge
```

## ⚙️ Utility Functions

### Form Validation

```tsx
import { validateForm, ValidationPatterns } from "@/lib/formUtils";

const schema = {
  email: {
    required: true,
    pattern: ValidationPatterns.email,
  },
  phone: {
    required: true,
    pattern: ValidationPatterns.phone,
  },
};

const errors = validateForm(formData, schema);
// errors = { email?: string, phone?: string }
```

### Common Utils

```tsx
import { formatDate, formatCurrency, truncate, capitalize } from "@/lib/utils";

formatDate("2024-01-15"); // 15 ม.ค. 2567
formatCurrency(1500); // ฿1,500.00
truncate("Long text", 10); // Long tex...
capitalize("hello"); // Hello
```

## 📱 Layout Integration

### Admin Layout

```tsx
// Already wrapped with DialogProvider in /admin/layout.tsx
import { DialogProvider, DialogRenderer } from "@/components/Dialog";

export default function AdminLayout({ children }) {
  return (
    <DialogProvider>
      <div className="flex">
        <AdminSidebar />
        <main>{children}</main>
      </div>
      <DialogRenderer />
    </DialogProvider>
  );
}
```

## 🔄 Migration from Old Components

### SuccessModal → Dialog

```tsx
// Before
<SuccessModal isOpen={isOpen} onClose={onClose} />;

// After
const { openDialog } = useDialog();
openDialog({
  type: "success",
  title: "สำเร็จ",
  confirmText: "ตกลง",
  onConfirm: onClose,
});
```

### ConfirmDialog → Dialog

```tsx
// Before
<ConfirmDialog isOpen={isOpen} onConfirm={onConfirm} onCancel={onCancel} />;

// After
openDialog({
  type: "warning",
  confirmText: "ยืนยัน",
  cancelText: "ยกเลิก",
  onConfirm: onConfirm,
  onCancel: onCancel,
});
```

## 📁 File Structure

```
src/
├── components/
│   ├── Dialog/
│   │   ├── Dialog.tsx
│   │   ├── DialogContext.tsx
│   │   ├── DialogRenderer.tsx
│   │   └── index.ts
│   ├── FormModal.tsx
│   ├── UserModal.tsx
│   ├── DepartmentModal.tsx
│   ├── RoleModal.tsx
│   ├── DataTable.tsx
│   ├── Pagination.tsx
│   ├── SearchBox.tsx
│   ├── Badge.tsx
│   ├── Notification.tsx
│   ├── Loading.tsx
│   ├── StatCard.tsx
│   └── index.ts
├── hooks/
│   ├── useNotifications.ts
│   ├── useModal.ts
│   └── index.ts
└── lib/
    ├── formUtils.ts
    └── utils.ts
```

## 🚀 Tips & Best Practices

1. **Always use Dialog for modals** - Don't create individual modal states
2. **Use SearchBox with debounce** - Prevent excessive API calls
3. **Type your form fields** - FormModal validates automatically
4. **Use badges for status** - Consistent UI across app
5. **Handle loading states** - Show spinners during async operations
6. **Clear notifications** - Auto-dismiss after 5 seconds by default

## ❓ FAQ

**Q: How to auto-close dialog after action?**
A: Dialog auto-closes after `onConfirm` resolves

```tsx
openDialog({
  onConfirm: async () => {
    await saveData();
    // Automatically closes after this
  },
});
```

**Q: How to customize notification duration?**
A: Pass `duration` parameter (milliseconds, 0 = no auto-dismiss)

```tsx
success("Title", "Message", 10000); // 10 seconds
error("Title", "Message", 0); // Manual dismiss only
```

**Q: Can I stack multiple dialogs?**
A: Yes! Dialog system supports multiple concurrent dialogs

**Q: How to prevent form submission on validation error?**
A: FormModal handles this automatically - shows errors without submitting
