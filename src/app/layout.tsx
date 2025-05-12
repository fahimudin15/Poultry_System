import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Egg Management System",
  description: "Manage your orders efficiently with our simple and intuitive system.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <nav className="bg-[#212529] text-white py-2 px-4">
          <div className="flex items-center gap-4">
            <span className="text-lg">Egg Management System</span>
            <Link href="/" className="text-[#adb5bd] hover:text-white text-sm">Home</Link>
            <Link href="/orders" className="text-[#adb5bd] hover:text-white text-sm">View Orders</Link>
            <Link href="/add-order" className="text-[#adb5bd] hover:text-white text-sm">Add Order</Link>
          </div>
        </nav>
        <main className="min-h-screen pb-16">
          {children}
        </main>
        <footer className="bg-[#212529] text-white text-center py-1.5 fixed bottom-0 w-full text-sm">
          <p>© 2025 Egg Management System</p>
        </footer>
      </body>
    </html>
  );
}
