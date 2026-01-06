import { siteConfig } from '../data/site';

export default function Footer() {
    return (
        <footer className="w-full bg-white dark:bg-black">
            {/* Logo Area */}
            <div className="w-full flex items-center justify-center overflow-hidden h-[200px] md:h-[300px]">
                <div className="opacity-100">
                    <img
                        src="/vista.svg"
                        alt="Vista Logo"
                        width={500}
                        height={500}
                        className="dark:invert object-contain max-w-[80vw] md:max-w-none"
                    />
                </div>
            </div>

            {/* Separator & Bottom Bar */}
            <div className="max-w-7xl mx-auto px-4 w-full pb-8">
                <div className="w-full border-t border-dashed border-zinc-200 dark:border-zinc-800 mb-8" />

                <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                    <div className="text-sm text-zinc-400 dark:text-zinc-600 font-medium tracking-tight">
                        &copy; {new Date().getFullYear()} {siteConfig.footer.copyright}
                    </div>
                </div>
            </div>
        </footer>
    );
}
