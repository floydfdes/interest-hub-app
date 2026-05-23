"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import Link from "next/link";
import Avatar from "react-avatar";
import { notifyAuthChanged, useCurrentUser } from "../hooks/useCurrentUser";

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const user = useCurrentUser();
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        notifyAuthChanged();
        setDropdownOpen(false);
        setIsMobileMenuOpen(false);
        router.push("/login");
    };

    const handleMobileNav = (href: string) => {
        setIsMobileMenuOpen(false);
        router.push(href);
    };

    return (
        <nav className="bg-primary text-text-light p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">
                    InterestHub
                </Link>

                <div className="hidden md:flex space-x-4">
                    <Link href="/" className="hover:underline">Home</Link>
                    <Link href="/explore" className="hover:underline">Explore</Link>
                    <Link href="/users" className="hover:underline">Users</Link>
                    {!user && <Link href="/login" className="hover:underline">Login</Link>}
                </div>

                <div className="hidden md:flex items-center space-x-4 relative" ref={dropdownRef}>
                    <button className="hover:underline">Notifications</button>
                    {user && (
                        <div className="relative">
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center space-x-2 focus:outline-none"
                            >
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic || undefined}
                                    round
                                    size="35"
                                    textSizeRatio={2}
                                />
                                <span>{user.name}</span>
                            </button>
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-white text-black rounded shadow-md z-50">
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 hover:bg-gray-100"
                                        onClick={() => setDropdownOpen(false)}
                                    >
                                        Profile
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Mobile menu toggle */}
                <div className="md:hidden">
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-primary bg-opacity-90 z-50 flex flex-col items-start p-4 space-y-4">
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="self-end focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <button onClick={() => handleMobileNav("/")}>Home</button>
                    <button onClick={() => handleMobileNav("/explore")}>Explore</button>
                    <button onClick={() => handleMobileNav("/users")}>Users</button>
                    {!user && <button onClick={() => handleMobileNav("/login")}>Login</button>}
                    {user && (
                        <div className="flex flex-col space-y-2">
                            <div className="flex items-center space-x-2">
                                <Avatar
                                    name={user.name}
                                    src={user.profilePic || undefined}
                                    round
                                    size="30"
                                    textSizeRatio={2}
                                />
                                <span>{user.name}</span>
                            </div>
                            <button onClick={() => handleMobileNav("/profile")}>Profile</button>
                            <button onClick={handleLogout}>Logout</button>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
