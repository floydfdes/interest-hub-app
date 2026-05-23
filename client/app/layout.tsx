import type { Metadata } from "next";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "InterestHub",
  description: "A social platform for sharing interests",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>
          <Navbar />
          <main className="min-h-screen bg-gray-50 pt-4 pb-12 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
