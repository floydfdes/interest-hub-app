import AdminGuard from '@/components/admin/AdminGuard';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="shell-container">
                <AdminNav />
                {children}
            </div>
        </AdminGuard>
    );
}
