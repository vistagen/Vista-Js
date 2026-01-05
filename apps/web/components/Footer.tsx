'client load';

import { useState, useEffect } from 'react';
import Image from 'vista/image';
import { Sun, Moon, Monitor } from 'lucide-react';
import { siteConfig } from '../data/site';

type Theme = 'light' | 'dark' | 'system';

// Declare the global Vista theme function
declare global {
    interface Window {
        __vistaSetTheme?: (theme: 'light' | 'dark') => void;
    }
}

export default function Footer() {
    const [theme, setTheme] = useState<Theme>('system');
    const [mounted, setMounted] = useState(false);

    // Initialize theme from localStorage
    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem('vista-theme') as Theme;
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
            setTheme(savedTheme);
        }
    }, []);

    // Handle theme change - use global Vista setter for atomic transitions
    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);

        // Determine effective theme
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const effectiveTheme = newTheme === 'system'
            ? (systemPrefersDark ? 'dark' : 'light')
            : newTheme;

        // Use global Vista theme setter if available (for atomic transitions)
        if (window.__vistaSetTheme) {
            window.__vistaSetTheme(effectiveTheme);
        }

        // Save preference (only if not system)
        if (newTheme === 'system') {
            localStorage.removeItem('vista-theme');
        } else {
            localStorage.setItem('vista-theme', newTheme);
        }
    };

    return (
        <footer className="w-full bg-white dark:bg-black">
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
                            onClick={() => handleThemeChange('light')}
                            className={`p-1.5 rounded-full transition-all ${theme === 'light'
                                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                }`}
                            aria-label="Light Mode"
                        >
                            <Sun size={14} />
                        </button>
                        <button
                            onClick={() => handleThemeChange('system')}
                            className={`p-1.5 rounded-full transition-all ${theme === 'system'
                                ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                                : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                                }`}
                            aria-label="System Mode"
                        >
                            <Monitor size={14} />
                        </button>
                        <button
                            onClick={() => handleThemeChange('dark')}
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
