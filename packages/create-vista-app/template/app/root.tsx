import "./globals.css";
import { Metadata } from 'vista';

// Metadata export (optional)
export const metadata: Metadata = {
    title: 'My Vista App',
    description: 'Built with Vista Framework',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    // Layout is a simple wrapper - server handles html/head/body
    return <>{children}</>;
}
