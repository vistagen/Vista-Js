import "./globals.css";
import { Metadata, Client } from 'vista';
import Navbar from '@/components/Navbar';

// Metadata export (optional)
export const metadata: Metadata = {
    title: 'Vista - The React Framework for Visionaries',
    description: 'Built with Vista Framework - Server Components, Rust-powered, instant HMR',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <Client><Navbar /></Client>
            {children}
        </>
    );
}
