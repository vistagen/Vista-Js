export const docsContent = {
    intro: {
        title: "The Beginning of Vista",
        paragraphs: [
            {
                text: "Vista is currently in its alpha stage. It's a framework born from a desire for simplicity without sacrificing power.",
                highlight: "alpha stage"
            },
            {
                text: "If you've used Next.js, Vista will feel remarkably familiar. That's intentional. We believe in the power of convention. However, Vista is built on a different foundation: Vite, but not just client-side—it's Server Side. This gives us—and you—the incredible speed and modern ecosystem that Vite is famous for.",
                highlight: "Vite, but not just client-side—it's Server Side."
            }
        ]
    },
    architecture: {
        title: "The Architecture of Simplicity",
        paragraphs: [
            "At its core, Vista simply connects the dots differently. Traditionally, you trade simplicity for power. We asked: why not have both? By leveraging Vite for the heavy lifting, we bypass the black-box complexity of other frameworks.",
            "When a request comes in, Vista spins up a lightweight server instance. It renders your React tree to a stream—not a string—piping it directly to the browser. This isn't just about speed; it's about fluidity. The server and client aren't separate worlds here; they are two sides of the same coin, sharing the same standard React code you already know."
        ]
    },
    footer: {
        text: "This is just the beginning. The story of Vista is being written right now, and by building with it, you're helping to write it.",
        notice: "Official Documentation Launching Soon"
    }
};
