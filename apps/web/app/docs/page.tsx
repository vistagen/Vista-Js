import Image from 'vista/image';
import { docsContent } from '../../data/docs';

export default function Docs() {
    return (
        <main className="min-h-screen bg-black selection:bg-primary/20 selection:text-primary text-zinc-100 font-sans">
            <div className="max-w-3xl mx-auto px-6 pt-32 md:pt-40 pb-20">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-thin tracking-tight mb-6">
                        {docsContent.intro.title}
                    </h1>
                    <div className="h-1 w-20 bg-primary rounded-full mb-8"></div>
                </div>

                <div className="prose prose-invert md:prose-lg max-w-none">
                    {docsContent.intro.paragraphs.map((p, i) => (
                        <p key={i}>
                            {p.text.split(p.highlight).map((part, index, array) => (
                                <span key={index}>
                                    {part}
                                    {index < array.length - 1 && (
                                        <strong className={p.highlight === "alpha stage" ? "" : "text-primary"}>
                                            {p.highlight}
                                        </strong>
                                    )}
                                </span>
                            ))}
                        </p>
                    ))}

                    <h3>{docsContent.architecture.title}</h3>
                    {docsContent.architecture.paragraphs.map((text, i) => (
                        <p key={i}>{text}</p>
                    ))}

                    <p className="mt-8 mb-16">
                        {docsContent.footer.text}
                    </p>

                    <div className="text-center text-primary/50 text-4xl font-thin italic mb-16">
                        {docsContent.footer.notice}
                    </div>
                </div>

                {/* Founder's Note */}
                <div className="border-t border-dashed border-zinc-800 pt-12 mt-12">
                    <h3 className="text-2xl font-thin tracking-tight mb-6 text-zinc-300">
                        A Note from the Founder
                    </h3>
                    <div className="prose prose-invert prose-sm max-w-none">
                        <p className="text-zinc-400 leading-relaxed">
                            Vista was born from a simple belief: that the future of web development
                            shouldn't be controlled by complexity. Every developer deserves tools
                            that are powerful yet intuitive, fast yet flexible.
                        </p>
                        <p className="text-zinc-400 leading-relaxed">
                            This framework is my gift to the community—built with passion,
                            countless late nights, and an unwavering commitment to developer experience.
                            I hope Vista helps you build something extraordinary.
                        </p>
                    </div>

                    <div className="mt-10 flex flex-col items-start">
                        <img
                            src="/signature.svg"
                            alt="Ankan Dalui Signature"
                            width={350}
                            height={120}
                            className="opacity-80 invert mb-2"
                            style={{ marginLeft: '-60px' }}
                        />
                        <p className="text-zinc-500 text-lg font-medium -mt-2">Ankan Dalui, Founder, Vista.js</p>
                    </div>
                </div>
            </div>
        </main>
    );
}
