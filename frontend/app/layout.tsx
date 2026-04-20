import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import { Footer } from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./lib/auth-context";
import { CartProvider } from "./lib/cart";
import ToasterProvider from "./components/ToasterProvider";
import { SocketProvider } from "./lib/socket-context";

export const metadata: Metadata = {
  title: 'PROJECT-X — Premium Marketplace',
  description: 'Discover curated products from trusted sellers. Shop with confidence on PROJECT-X, the next‑gen e‑commerce experience.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#0a0a0f] text-[#f8fafc] antialiased">
        <ToasterProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <Navbar />
                <main className="min-h-screen">{children}</main>
                <Footer />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </ToasterProvider>
      </body>
    </html>
  );
}