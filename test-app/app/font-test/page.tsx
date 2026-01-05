import React from 'react';
import { Head } from 'vista/head';
import { Inter, FontProvider } from 'vista/font';

// Configure font
const inter = Inter({
    weight: ['400', '700'],
    variable: '--font-inter',
});

export default function FontTestPage() {
    return (
        <FontProvider fonts={[inter]}>
            <Head>
                <title></title>
                <meta name="description" content="Testing Vista font optimization and head injection" />
            </Head>

            <div style={{
                fontFamily: inter.style.fontFamily,
                padding: '40px',
                color: '#fff',
                backgroundColor: '#111',
                minHeight: '100vh',
            }}>
                <h1 style={{ fontWeight: 700, fontSize: '3rem', marginBottom: '1rem' }}>
                    Font Optimization Test
                </h1>
                <p style={{ fontSize: '1.5rem', lineHeight: 1.6 }}>
                    This text should be rendered in the <strong>Inter</strong> font from Google Fonts.
                </p>
                <div style={{
                    marginTop: '20px',
                    padding: '20px',
                    border: '1px solid #333',
                    borderRadius: '8px'
                }}>
                    <h3>Debug Info:</h3>
                    <pre style={{ fontFamily: 'monospace', color: '#888' }}>
                        Font Family: {inter.style.fontFamily}{'\n'}
                        Variable: {inter.variable}{'\n'}
                        Class: {inter.className}
                    </pre>
                </div>
            </div>
        </FontProvider>
    );
}
