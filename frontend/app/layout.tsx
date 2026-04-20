import './globals.css';
import type { ReactNode } from 'react';
import { Footer } from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./lib/auth-context";
import { CartProvider } from "./lib/cart";
import ToasterProvider from "./components/ToasterProvider";
import { SocketProvider } from "./lib/socket-context";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ToasterProvider>
          <AuthProvider>
            <SocketProvider>
              <CartProvider>
                <Navbar />
                {children}
                <Footer />
              </CartProvider>
            </SocketProvider>
          </AuthProvider>
        </ToasterProvider>
      </body>
    </html>
  );
}