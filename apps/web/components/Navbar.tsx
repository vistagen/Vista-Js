'client load';
import { useState, useEffect } from 'react';
import { Github } from 'lucide-react';
import { siteConfig } from '../data/site';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [stars, setStars] = useState<string | number>(0);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        // Fetch GitHub Stars
        const fetchStars = async () => {
            try {
                // Extract owner/repo from url: https://github.com/owner/repo
                const url = new URL(siteConfig.links.github);
                const pathParts = url.pathname.split('/').filter(Boolean);
                if (pathParts.length >= 2) {
                    const owner = pathParts[0];
                    const repo = pathParts[1];
                    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
                    const data = await res.json();
                    if (data.stargazers_count) {
                        setStars(data.stargazers_count);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch stars:', error);
            }
        };

        fetchStars();

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
                    {/* Use regular img for logo - instant load, no hydration flash */}
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
                        <Github className="w-4 h-4 text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                        <span className="hidden md:inline">Star on GitHub</span>
                        <div className="hidden md:block w-[1px] h-4 bg-black/10 dark:bg-white/10 mx-2" />
                        <span className="hidden md:inline text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors font-mono">{stars}</span>
                    </a>
                </div>
            </div>
        </nav>
    );
}
