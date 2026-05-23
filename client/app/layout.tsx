import type { Metadata } from "next";
import "./globals.css";
import StyledComponentsRegistry from "@/lib/AntdRegistry";
import Navbar from "@/components/Navbar";
import Footer from "@/app/components/Footer";
import GlobalLoader from "@/app/components/GlobalLoader";

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
          <GlobalLoader />
          <Navbar />
          <main className="app-shell">
            {children}
          </main>
          <Footer />
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
