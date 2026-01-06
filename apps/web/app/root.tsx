import "./globals.css";
import { Metadata, Client } from 'vista';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
        <div className="min-h-screen flex flex-col bg-black text-zinc-100">
            <Client><Navbar /></Client>
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
}
