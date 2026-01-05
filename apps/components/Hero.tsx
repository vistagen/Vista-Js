import React from 'react';

export function Hero() {
    return (
        <section className="relative flex flex-col items-center justify-center min-h-[80vh] px-4 text-center overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />

            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter mb-6 relative z-10">
                The <span className="text-gradient">Vista</span> Framework
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-10 relative z-10 font-light">
                The next-generation React framework for the modern web. <br />
                Built on Rust. Powered by Server Components.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                <a href="/docs" className="px-8 py-3 bg-[#0070f3] hover:brightness-110 text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(0,112,243,0.3)]">
                    Get Started
                </a>
                <button className="px-8 py-3 glass hover:bg-white/10 text-white rounded-full font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    <span>npm install create-vista-app</span>
                </button>
            </div>
        </section>
    );
}
