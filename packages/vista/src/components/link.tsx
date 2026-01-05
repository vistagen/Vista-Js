import React from 'react';
import { useRouter } from '../router/context';

export default function Link({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
    const router = useRouter();

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        router.push(href);
    };

    return (
        <a href={href} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}
