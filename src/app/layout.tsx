import type { Metadata } from "next";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

export const metadata: Metadata = {
  title: "QiewCode Admin Portal",
  description: "Secure administrative interface for QiewCode platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AdminAuthProvider>{children}</AdminAuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
