'client load';

import { useState, useEffect } from 'react';
import Image from 'vista/image';
import { Sun, Moon, Monitor } from 'lucide-react';
import { siteConfig } from '../data/site';

type Theme = 'light' | 'dark' | 'system';

export default function Footer() {
    const [theme, setTheme] = useState<Theme>('system');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage or system
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('vista-theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
        }
    }, []);

    // Apply theme
    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = (t: Theme) => {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            const effectiveTheme = t === 'system' ? systemTheme : t;

            if (effectiveTheme === 'dark') {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme(theme);

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        } else {
            localStorage.setItem('vista-theme', theme);
        }
    }, [theme]);

    if (!mounted) return null;

    return (
        <footer className="w-full bg-white dark:bg-black transition-colors duration-300">
            {/* Logo Interaction Area */}
            <div
                className="w-full flex items-center justify-center overflow-hidden h-[200px] md:h-[300px]"
            >
                <div
                    className="opacity-100"
                >
                    <Image
                        src="/vista.svg"
                        alt="Vista Logo"
                        width={500}
                        height={500}
                        className="dark:invert object-contain max-w-[80vw] md:max-w-none"
                        priority
                    />
                </div>
            </div>

            {/* Separator & Bottom Bar */}
            <div className="max-w-7xl mx-auto px-4 w-full pb-8">
                <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800 mb-8" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-zinc-400 dark:text-zinc-600 font-medium tracking-tight">
                        &copy; {new Date().getFullYear()} {siteConfig.footer.copyright}
                    </div>

                    {/* Theme Switcher */}
                    <div className="flex items-center p-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => setTheme('light')}
                            className={`p-1.5 rounded-full transition-all ${theme === 'light'
                                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                }`}
                            aria-label="Light Mode"
                        >
                            <Sun size={14} />
                        </button>
                        <button
                            onClick={() => setTheme('system')}
                            className={`p-1.5 rounded-full transition-all ${theme === 'system'
                                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                }`}
                            aria-label="System Mode"
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            onClick={() => setTheme('dark')}
                            className={`p-1.5 rounded-full transition-all ${theme === 'dark'
                                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                }`}
                            aria-label="Dark Mode"
                        >
                            <Moon size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </footer>

    );
}
