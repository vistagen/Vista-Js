import { features } from '../data/features';

export default function Features() {
    return (
        <section className="min-h-screen flex flex-col justify-center py-24 px-4 w-full relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,106,0,0.14),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(255,106,0,0.08),transparent_40%)]" />

            <div className="max-w-7xl mx-auto relative z-10">
                <h2 className="text-3xl md:text-5xl font-normal mb-16 text-center tracking-tight">
                    What ships in Vista now
                </h2>

                {/* Dashed Grid Mesh */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-t border-l border-dashed border-zinc-800 bg-black/50 backdrop-blur-[2px]">
                    {features.map((feature, i) => (
                        <div
                            key={i}
                            className="p-8 border-r border-b border-dashed border-zinc-800 hover:bg-white/5 transition-colors"
                        >
                            <h3 className="text-lg font-medium mb-3">{feature.title}</h3>
                            <p className="text-sm text-zinc-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
