'client load';
import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { siteConfig } from '../data/site';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled
                ? 'bg-white/50 dark:bg-black/50 backdrop-blur-md'
                : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
                <a href="/" className="flex items-center gap-2">
                    <img
                        src="/vista.svg"
                        width={120}
                        height={40}
                        alt={`${siteConfig.name} Logo`}
                        className="dark:invert relative z-10"
                        style={{ width: '120px', height: 'auto' }}
                    />
                </a>

                <div className="flex items-center gap-4 md:gap-6">
                    {siteConfig.nav.map((item) => (
                        <a
                            key={item.href}
                            href={item.href}
                            className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                        >
                            {item.title}
                        </a>
                    ))}

                    <div className="w-[1px] h-6 bg-zinc-200 dark:bg-zinc-800" />

                    <a
                        href={siteConfig.links.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm font-medium text-black dark:text-white group"
                    >
                        <Github className="w-4 h-4" />
                        <span className="hidden md:inline">Star on GitHub</span>
                    </a>
                </div>
            </div>
        </nav>
    );
}
