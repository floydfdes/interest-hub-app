'use client';

import { notifyAuthChanged, useCurrentUser } from '@/app/hooks/useCurrentUser';
import { Avatar, Dropdown } from 'antd';
import { Bookmark, ChevronDown, Compass, LogIn, LogOut, PenLine, Search, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
    { href: '/', label: 'Feed', icon: Compass, authOnly: false },
    { href: '/explore', label: 'Explore', icon: Search, authOnly: false },
    { href: '/users', label: 'People', icon: UserRound, authOnly: false },
    { href: '/saved', label: 'Saved', icon: Bookmark, authOnly: true },
];

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const user = useCurrentUser();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        notifyAuthChanged();
        router.push('/login');
    };

    const userMenu = [
        {
            key: 'profile',
            label: <Link href="/profile">View profile</Link>,
            icon: <UserRound size={15} />,
        },
        {
            key: 'logout',
            label: 'Log out',
            icon: <LogOut size={15} />,
            onClick: handleLogout,
        },
    ];

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/78 backdrop-blur-xl">
            <div className="shell-container flex h-[4.5rem] items-center justify-between gap-4 px-4 sm:px-6">
                <Link href="/" className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-200">
                        IH
                    </span>
                    <div className="hidden sm:block">
                        <p className="text-[1.05rem] font-bold leading-none tracking-tight text-slate-900">InterestHub</p>
                        <p className="mt-1 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-slate-400">Discover more</p>
                    </div>
                </Link>

                <nav className="flex items-center gap-1 rounded-2xl border border-slate-200/80 bg-slate-50/90 p-1">
                    {navItems.filter((item) => !item.authOnly || user).map(({ href, label, icon: Icon }) => {
                        const selected = pathname === href || (href !== '/' && pathname.startsWith(href));
                        return (
                            <Link
                                key={href}
                                href={href}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition sm:px-4 ${selected
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                <Icon size={16} />
                                <span className="hidden md:block">{label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="flex items-center gap-2">
                    {user ? (
                        <>
                            <Link href="/create-post" className="primary-button hidden sm:inline-flex">
                                <PenLine size={15} />
                                Post
                            </Link>
                            <Dropdown menu={{ items: userMenu }} placement="bottomRight" trigger={['click']}>
                                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5 pr-2 text-sm font-medium text-slate-700 transition hover:border-indigo-200">
                                    <Avatar src={user.profilePic || null} size={32}>{user.name.charAt(0)}</Avatar>
                                    <span className="hidden lg:inline">{user.name}</span>
                                    <ChevronDown className="hidden text-slate-400 lg:block" size={14} />
                                </button>
                            </Dropdown>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="secondary-button hidden sm:inline-flex">
                                <LogIn size={15} />
                                Log in
                            </Link>
                            <Link href="/register" className="primary-button">
                                Get started
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
