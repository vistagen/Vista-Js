'client load';

import { useState, useEffect } from 'react';

// Doc navigation structure
const docsNav = [
    {
        title: 'Getting Started',
        items: [
            { title: 'Introduction', slug: 'introduction' },
            { title: 'Installation', slug: 'installation' },
            { title: 'Quick Start', slug: 'quick-start' },
        ]
    },
    {
        title: 'Core Concepts',
        items: [
            { title: 'Project Structure', slug: 'project-structure' },
            { title: 'Routing', slug: 'routing' },
            { title: 'Server Components', slug: 'server-components' },
            { title: 'Client Components', slug: 'client-components' },
        ]
    },
    {
        title: 'API Reference',
        items: [
            { title: 'vista/image', slug: 'vista-image' },
            { title: 'Configuration', slug: 'configuration' },
            { title: 'CLI Commands', slug: 'cli-commands' },
        ]
    }
];

export default function DocsPage() {
    const [activeSlug, setActiveSlug] = useState('introduction');

    // Handle scroll to update active section
    useEffect(() => {
        const handleScroll = () => {
            const sections = document.querySelectorAll('[data-section]');
            let currentSection = 'introduction';

            sections.forEach((section) => {
                const rect = section.getBoundingClientRect();
                if (rect.top <= 100) {
                    currentSection = section.getAttribute('data-section') || 'introduction';
                }
            });

            setActiveSlug(currentSection);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-white dark:bg-black text-zinc-900 dark:text-zinc-100">
            {/* Sidebar - Fixed, starts below navbar */}
            <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 border-r border-zinc-200 dark:border-zinc-800 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/50">
                <nav className="p-6 space-y-6">
                    {docsNav.map((section) => (
                        <div key={section.title}>
                            <h4 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                                {section.title}
                            </h4>
                            <ul className="space-y-1">
                                {section.items.map((item) => (
                                    <li key={item.slug}>
                                        <a
                                            href={`#${item.slug}`}
                                            onClick={() => setActiveSlug(item.slug)}
                                            className={`block text-sm py-1.5 px-3 rounded-md transition-colors
                                                ${activeSlug === item.slug
                                                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white font-medium'
                                                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900'
                                                }`}
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content - With left margin for sidebar */}
            <main className="lg:ml-64 pt-16">
                <div className="max-w-3xl mx-auto px-6 py-12">

                    {/* Alpha Warning */}
                    <div className="mb-10 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <span className="text-amber-600 dark:text-amber-400 text-lg">⚠️</span>
                            <div>
                                <h3 className="font-semibold text-amber-800 dark:text-amber-300 text-sm">Alpha Software</h3>
                                <p className="text-sm text-amber-700 dark:text-amber-400/80 mt-1">
                                    Vista is in <strong>alpha</strong>. Not recommended for production. APIs may change.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Introduction */}
                    <section data-section="introduction" id="introduction" className="mb-16 scroll-mt-20">
                        <h1 className="text-4xl font-bold tracking-tight mb-4">Welcome to Vista</h1>
                        <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                            Vista is a modern React framework for building fast, server-rendered web applications.
                            Built with Rust and SWC at its core for exceptional performance.
                        </p>

                        <h2 className="text-xl font-semibold mb-3">What is Vista?</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Vista combines server-side rendering with React Server Components. It handles:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-zinc-600 dark:text-zinc-400 mb-6 ml-2">
                            <li>Server-side rendering with streaming</li>
                            <li>Automatic code splitting</li>
                            <li>File-based routing</li>
                            <li>Fast Hot Module Replacement (HMR)</li>
                            <li>TypeScript support out of the box</li>
                        </ul>
                    </section>

                    {/* Installation */}
                    <section data-section="installation" id="installation" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Installation</h2>

                        <h3 className="text-lg font-semibold mb-3">System Requirements</h3>
                        <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400 mb-6 ml-2">
                            <li>Node.js 18.17 or later</li>
                            <li>Windows, macOS, or Linux</li>
                        </ul>

                        <h3 className="text-lg font-semibold mb-3">Create a New Project</h3>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Get started with <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">create-vista-app</code>:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 mb-4 overflow-x-auto">
                            <code>npx create-vista-app my-app</code>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Then start the development server:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
                            <pre>{`cd my-app
npm run dev`}</pre>
                        </div>
                    </section>

                    {/* Quick Start */}
                    <section data-section="quick-start" id="quick-start" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Start</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Your project structure:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 mb-6 overflow-x-auto">
                            <pre>{`my-app/
├── app/
│   ├── index.tsx      # Home page
│   ├── root.tsx       # Root layout
│   └── globals.css    # Global styles
├── components/        # Shared components
├── public/            # Static assets
└── vista.config.ts`}</pre>
                        </div>
                    </section>

                    {/* Project Structure */}
                    <section data-section="project-structure" id="project-structure" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Project Structure</h2>
                        <div className="space-y-3">
                            {[
                                { file: 'index.tsx', desc: 'Page component for the route' },
                                { file: 'root.tsx', desc: 'Root layout wrapping all pages' },
                                { file: 'layout.tsx', desc: 'Nested layout for route segments' },
                                { file: 'loading.tsx', desc: 'Loading UI for the route' },
                                { file: 'not-found.tsx', desc: '404 page for the route' },
                            ].map(({ file, desc }) => (
                                <div key={file} className="flex items-center gap-4">
                                    <code className="bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-sm font-mono text-primary min-w-[120px]">{file}</code>
                                    <span className="text-zinc-600 dark:text-zinc-400 text-sm">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Server Components */}
                    <section data-section="server-components" id="server-components" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Server Components</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            By default, all components are <strong>Server Components</strong>. They render on the server:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
                            <pre>{`// Server Component (default)
export default async function ProductPage() {
    const products = await fetchProducts();
    
    return (
        <ul>
            {products.map(p => <li key={p.id}>{p.name}</li>)}
        </ul>
    );
}`}</pre>
                        </div>
                    </section>

                    {/* Client Components */}
                    <section data-section="client-components" id="client-components" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Client Components</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            For interactivity, add <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">'client load'</code> at the top:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
                            <pre>{`'client load';

import { useState } from 'react';

export default function Counter() {
    const [count, setCount] = useState(0);
    
    return (
        <button onClick={() => setCount(count + 1)}>
            Count: {count}
        </button>
    );
}`}</pre>
                        </div>
                    </section>

                    {/* vista/image */}
                    <section data-section="vista-image" id="vista-image" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">vista/image</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Optimized image component with lazy loading:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
                            <pre>{`import Image from 'vista/image';

<Image 
    src="/photo.jpg" 
    alt="Description" 
    width={800} 
    height={600}
    priority  // Load immediately
/>`}</pre>
                        </div>
                    </section>

                    {/* Configuration */}
                    <section data-section="configuration" id="configuration" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">Configuration</h2>
                        <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Configure Vista in <code className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono">vista.config.ts</code>:
                        </p>
                        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 font-mono text-sm text-zinc-100 overflow-x-auto">
                            <pre>{`import { defineConfig } from 'vista';

export default defineConfig({
    // Configuration options
});`}</pre>
                        </div>
                    </section>

                    {/* CLI Commands */}
                    <section data-section="cli-commands" id="cli-commands" className="mb-16 scroll-mt-20">
                        <h2 className="text-2xl font-bold tracking-tight mb-4">CLI Commands</h2>
                        <div className="space-y-4">
                            {[
                                { cmd: 'vista dev', desc: 'Start development server with HMR' },
                                { cmd: 'vista build', desc: 'Build for production' },
                                { cmd: 'vista start', desc: 'Start production server' },
                            ].map(({ cmd, desc }) => (
                                <div key={cmd} className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
                                    <code className="text-primary font-mono font-medium">{cmd}</code>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{desc}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Footer */}
                    <footer className="border-t border-zinc-200 dark:border-zinc-800 pt-8 mt-8">
                        <p className="text-sm text-zinc-400 text-center">
                            Vista Framework © {new Date().getFullYear()} — Alpha Release
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
