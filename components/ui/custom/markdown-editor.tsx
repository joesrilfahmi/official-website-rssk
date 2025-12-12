'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Heading3,
    Heading4,
    Heading5,
    Heading6
} from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

export function MarkdownEditor({
    value,
    onChange,
    disabled = false,
    placeholder = 'Tulis konten dalam format Markdown...',
    className = ''
}: MarkdownEditorProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const insertMarkdown = (before: string, after: string = '') => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newText);

        setTimeout(() => {
            textarea.focus();
            const newPosition = start + before.length + selectedText.length;
            textarea.setSelectionRange(newPosition, newPosition);
        }, 0);
    };

    const insertHeading = (level: number) => {
        const hashes = '#'.repeat(level);
        insertMarkdown(`${hashes} `, '\n');
    };

    const toolbarButtons = [
        { icon: Heading1, label: 'Heading 1', action: () => insertHeading(1) },
        { icon: Heading2, label: 'Heading 2', action: () => insertHeading(2) },
        { icon: Heading3, label: 'Heading 3', action: () => insertHeading(3) },
        { icon: Heading4, label: 'Heading 4', action: () => insertHeading(4) },
        { icon: Heading5, label: 'Heading 5', action: () => insertHeading(5) },
        { icon: Heading6, label: 'Heading 6', action: () => insertHeading(6) },
        { icon: Bold, label: 'Bold', action: () => insertMarkdown('**', '**') },
        { icon: Italic, label: 'Italic', action: () => insertMarkdown('*', '*') },
        { icon: List, label: 'Unordered List', action: () => insertMarkdown('- ', '\n') },
        { icon: ListOrdered, label: 'Ordered List', action: () => insertMarkdown('1. ', '\n') },
    ];

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1 p-2 border rounded-t-lg bg-muted/50">
                <TooltipProvider>
                    {toolbarButtons.map((button, index) => (
                        <Tooltip key={index}>
                            <TooltipTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={button.action}
                                    disabled={disabled}
                                >
                                    <button.icon className="h-4 w-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{button.label}</p>
                            </TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={`w-full min-h-[400px] p-4 font-mono text-sm border rounded-b-lg rounded-t-none focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 ${className}`}
            />
        </div>
    );
}