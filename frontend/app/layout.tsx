import './globals.css';
import { Footer } from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./lib/auth-context";
import ToasterProvider from "./components/ToasterProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <ToasterProvider>
          <AuthProvider>
            <Navbar />
            {children}
            <Footer />
          </AuthProvider>
        </ToasterProvider>
      </body>
    </html>
  );
}