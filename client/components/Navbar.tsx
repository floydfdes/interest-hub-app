'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Layout, Menu, Button, Avatar, Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';
import { notifyAuthChanged, useCurrentUser } from '@/app/hooks/useCurrentUser';

const { Header } = Layout;

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

    const menuItems = [
        {
            key: '/',
            label: <Link href="/">Home</Link>,
        },
    ];

    const userMenu = [
        {
            key: 'profile',
            label: <Link href="/profile">Profile</Link>,
            icon: <UserOutlined />,
        },
        {
            key: 'logout',
            label: 'Logout',
            icon: <LogoutOutlined />,
            onClick: handleLogout,
        },
    ];

    return (
        <Header className="flex items-center justify-between bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
                <Link href="/" className="text-xl font-bold text-blue-600 mr-8">
                    InterestHub
                </Link>
                <Menu
                    mode="horizontal"
                    selectedKeys={[pathname]}
                    items={menuItems}
                    className="border-none min-w-[200px]"
                />
            </div>
            <div>
                {user ? (
                    <Dropdown menu={{ items: userMenu }} placement="bottomRight">
                        <div className="cursor-pointer flex items-center gap-2">
                            <Avatar icon={<UserOutlined />} src={user.profilePic} />
                            <span className="hidden sm:inline">{user.name}</span>
                        </div>
                    </Dropdown>
                ) : (
                    <div className="flex gap-2">
                        <Link href="/login">
                            <Button type="text" icon={<LoginOutlined />}>
                                Login
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button type="primary" icon={<UserAddOutlined />}>
                                Register
                            </Button>
                        </Link>
                    </div>
                )}
            </div>
        </Header>
    );
};

export default Navbar;
