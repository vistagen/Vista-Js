'use client';

import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';
import { CREATE_VISTA_APP_COMMAND } from '../data/site';

export default function CopyCommand() {
    const [copied, setCopied] = useState(false);
    const command = CREATE_VISTA_APP_COMMAND;

    const copyWithFallback = async (text: string): Promise<boolean> => {
        if (typeof window === 'undefined') return false;

        if (navigator?.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text);
                return true;
            } catch {
                // Fallback to legacy copy path below
            }
        }

        try {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'fixed';
            textarea.style.top = '-9999px';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            textarea.setSelectionRange(0, text.length);
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            return successful;
        } catch {
            return false;
        }
    };

    const handleCopy = async () => {
        const didCopy = await copyWithFallback(command);
        if (didCopy) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            console.error('Failed to copy command to clipboard.');
        }
    };

    return (
        <div className="flex justify-center mt-8">
            <button
                onClick={handleCopy}
                className="group flex items-center gap-2 px-3 py-1.5 bg-zinc-900/60 rounded-full hover:bg-zinc-800 transition-all cursor-pointer select-none"
            >
                <Terminal size={14} className="text-zinc-400" />
                <code className="text-sm font-mono text-zinc-300">
                    {command}
                </code>
                <div className="relative w-4 h-4 ml-1">
                    <div
                        className={`absolute inset-0 transition-all duration-300 transform ${copied ? 'opacity-0 scale-50' : 'opacity-100 scale-100'
                            }`}
                    >
                        <Copy size={14} className="text-zinc-400 group-hover:text-white transition-colors" />
                    </div>
                    <div
                        className={`absolute inset-0 transition-all duration-300 transform ${copied ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                            }`}
                    >
                        <Check size={14} className="text-green-500" />
                    </div>
                </div>
            </button>
        </div>
    );
}
