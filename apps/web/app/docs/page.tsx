import Footer from '../../components/Footer';
import { docsContent } from '../../data/docs';

export default function Docs() {
    return (
        <main className="min-h-screen bg-white dark:bg-black selection:bg-primary/20 selection:text-primary text-zinc-900 dark:text-zinc-100 font-sans">


            <div className="max-w-3xl mx-auto px-6 pt-32 md:pt-40 pb-20">
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-thin tracking-tight mb-6">
                        {docsContent.intro.title}
                    </h1>
                    <div className="h-1 w-20 bg-primary rounded-full mb-8"></div>
                </div>

                <div className="prose dark:prose-invert md:prose-lg max-w-none">
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

                    <div className="text-center text-primary/50 text-4xl font-thin italic">
                        {docsContent.footer.notice}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
