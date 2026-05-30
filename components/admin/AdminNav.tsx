'use client';

import { Activity, Flag, LayoutDashboard, Newspaper, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: UsersRound },
    { href: '/admin/posts', label: 'Posts', icon: Newspaper },
    { href: '/admin/activities', label: 'Activity', icon: Activity },
    { href: '/admin/reports', label: 'Reports', icon: Flag },
];

export default function AdminNav() {
    const pathname = usePathname();

    return (
        <nav className="surface mb-7 flex flex-wrap gap-2 p-2" aria-label="Admin navigation">
            {items.map(({ href, label, icon: Icon }) => {
                const selected = pathname === href || (href !== '/admin' && pathname.startsWith(href));
                return (
                    <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                            selected ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                        }`}
                    >
                        <Icon size={16} />
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
