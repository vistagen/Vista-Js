'client load';

import { useState, useEffect } from 'react';
import { SingularityShaders } from './ui/SingularityShaders';
import { features } from '../data/features';

export default function Features() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <section className="min-h-screen flex flex-col justify-center py-24 px-4 w-full relative overflow-hidden">
            {/* Black Hole Shader Background - Left Side */}
            <div
                className={`absolute top-1/2 -left-[600px] -translate-y-1/2 w-[2000px] h-[2000px] pointer-events-none z-0 transition-opacity duration-[2000ms] ease-in-out ${isVisible ? 'opacity-30' : 'opacity-0'
                    }`}
            >
                <SingularityShaders size={0.4} />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <h2 className="text-3xl md:text-5xl font-normal mb-16 text-center tracking-tight">
                    What's in Vista?
                </h2>

                {/* Dashed Grid Mesh */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-dashed border-zinc-300 dark:border-zinc-800 bg-white/50 dark:bg-black/50 backdrop-blur-[2px]">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="p-8 border-r border-b border-dashed border-zinc-300 dark:border-zinc-800 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                            <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
