import './globals.css';
import { Footer } from "./components/Footer";
import Navbar from "./components/Navbar";
import { AuthProvider } from "./lib/auth-context";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light">
      <body>
        <AuthProvider>
          <Navbar />
          {children}
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}