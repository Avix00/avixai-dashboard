'use client';

import { TranscriptItem } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface TranscriptChatProps {
    transcriptJson?: TranscriptItem[] | null;
    transcriptText?: string | null;
    maxHeight?: string;
}

/**
 * Chat-style visualization of conversation transcript.
 * Shows Agent messages on the left, User messages on the right.
 * Falls back to plain text if structured data is unavailable.
 */
export function TranscriptChat({
    transcriptJson,
    transcriptText,
    maxHeight = '400px'
}: TranscriptChatProps) {
    // If we have structured data, render as chat
    if (transcriptJson && transcriptJson.length > 0) {
        return (
            <div
                className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar"
                style={{ maxHeight }}
            >
                {transcriptJson.map((item, index) => (
                    <ChatBubble
                        key={index}
                        role={item.role}
                        content={item.content}
                    />
                ))}
            </div>
        );
    }

    // Fallback: Render plain text transcript
    if (transcriptText) {
        return (
            <div
                className="overflow-y-auto pr-2 custom-scrollbar"
                style={{ maxHeight }}
            >
                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <p className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
                        {transcriptText}
                    </p>
                </div>
            </div>
        );
    }

    // No transcript available
    return (
        <div className="flex items-center justify-center p-8 text-white/40">
            <p className="text-sm italic">Nessun transcript disponibile</p>
        </div>
    );
}

function ChatBubble({ role, content }: { role: 'agent' | 'user'; content: string }) {
    const isAgent = role === 'agent';

    return (
        <div className={cn(
            'flex items-start gap-2',
            isAgent ? 'flex-row' : 'flex-row-reverse'
        )}>
            {/* Avatar */}
            <div className={cn(
                'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                isAgent
                    ? 'bg-gradient-to-br from-cyan-500/30 to-teal-500/30 border border-cyan-500/40'
                    : 'bg-gradient-to-br from-violet-500/30 to-purple-500/30 border border-violet-500/40'
            )}>
                {isAgent ? (
                    <Bot className="w-4 h-4 text-cyan-300" />
                ) : (
                    <User className="w-4 h-4 text-violet-300" />
                )}
            </div>

            {/* Bubble */}
            <div className={cn(
                'max-w-[80%] px-4 py-2.5 rounded-2xl',
                isAgent
                    ? 'bg-gradient-to-br from-cyan-500/20 to-teal-500/15 border border-cyan-500/20 rounded-tl-sm'
                    : 'bg-gradient-to-br from-violet-500/20 to-purple-500/15 border border-violet-500/20 rounded-tr-sm'
            )}>
                <p className={cn(
                    'text-sm leading-relaxed',
                    isAgent ? 'text-cyan-50' : 'text-violet-50'
                )}>
                    {content}
                </p>
            </div>
        </div>
    );
}
