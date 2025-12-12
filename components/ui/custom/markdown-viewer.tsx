// components/ui/custom/markdown-viewer.tsx
'use client';

import React from 'react';

interface MarkdownViewerProps {
    content: string;
    className?: string;
}

export function MarkdownViewer({ content, className = '' }: MarkdownViewerProps) {
    const parseMarkdown = (text: string): string => {
        let html = text;

        html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mt-4 mb-2">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mt-6 mb-3">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>');
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold">$1</strong>');
        html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>');
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>');
        html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/gim, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4" loading="lazy" />');
        html = html.replace(/\n\n/gim, '</p><p class="mb-4">');
        html = html.replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>');
        html = html.replace(/(<li.*<\/li>)/g, '<ul class="list-disc mb-4">$1</ul>');
        html = html.replace(/`([^`]+)`/gim, '<code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm font-mono">$1</code>');

        return `<p class="mb-4">${html}</p>`;
    };

    return (
        <div
            className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
            dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
        />
    );
}