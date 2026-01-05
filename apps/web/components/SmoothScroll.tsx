'client load';

import { useEffect } from 'react';
import Lenis from 'lenis';

export default function SmoothScroll() {
    useEffect(() => {
        // Add lenis class to html for CSS handling
        document.documentElement.classList.add('lenis');

        const lenis = new Lenis({
            lerp: 0.1,
            smoothWheel: true,
        });

        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            document.documentElement.classList.remove('lenis');
            lenis.destroy();
        };
    }, []);

    return null;
}
