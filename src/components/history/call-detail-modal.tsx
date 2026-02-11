'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Phone, Clock, Calendar, TrendingUp, MessageSquare, FileText, Headphones } from 'lucide-react';
import { Call } from '@/lib/supabase/types';
import { formatDuration, formatDate, formatPhoneNumber, getSentimentColor, getSentimentLabel, cn } from '@/lib/utils';
import { TranscriptChat } from '@/components/shared/transcript-chat';

interface CallDetailModalProps {
    call: Call;
    isOpen: boolean;
    onClose: () => void;
}

export function CallDetailModal({ call, isOpen, onClose }: CallDetailModalProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        // Reset state when modal opens with new call
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
    }, [call.id]);

    useEffect(() => {
        // Close on escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    const handlePlayPause = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Format transcript for display
    const formatTranscript = (transcript: string | null) => {
        if (!transcript) return null;

        // Check if it's already formatted with [role] prefixes
        if (transcript.includes('[')) {
            return transcript.split('\n').map((line, i) => {
                const isAI = line.toLowerCase().includes('[ai]') || line.toLowerCase().includes('[assistant]') || line.toLowerCase().includes('[bot]');
                const isUser = line.toLowerCase().includes('[user]') || line.toLowerCase().includes('[customer]') || line.toLowerCase().includes('[client]');

                return (
                    <div
                        key={i}
                        className={cn(
                            'p-3 rounded-xl mb-2 text-sm',
                            isAI ? 'bg-violet-500/10 border border-violet-500/20 ml-4' : '',
                            isUser ? 'bg-cyan-500/10 border border-cyan-500/20 mr-4' : '',
                            !isAI && !isUser ? 'bg-white/5' : ''
                        )}
                    >
                        {line}
                    </div>
                );
            });
        }

        // Plain text transcript
        return <p className="text-white/70 whitespace-pre-wrap">{transcript}</p>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Phone className="w-5 h-5 text-cyan-400" />
                        Dettagli Chiamata
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Call Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Phone Number */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                Numero
                            </p>
                            <p className="text-white font-medium">
                                {formatPhoneNumber(call.customer_number)}
                            </p>
                        </div>

                        {/* Date */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Data
                            </p>
                            <p className="text-white font-medium">
                                {formatDate(call.created_at)}
                            </p>
                        </div>

                        {/* Duration */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Durata
                            </p>
                            <p className="text-white font-medium font-mono">
                                {formatDuration(call.duration)}
                            </p>
                        </div>

                        {/* Sentiment */}
                        <div className="bg-white/5 rounded-xl p-4">
                            <p className="text-white/40 text-xs mb-1 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                Sentiment
                            </p>
                            <p className={cn('font-medium', getSentimentColor(call.sentiment))}>
                                {getSentimentLabel(call.sentiment)}
                            </p>
                        </div>
                    </div>

                    {/* Audio Player */}
                    {call.recording_url && (
                        <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 text-white/60">
                                <Headphones className="w-4 h-4" />
                                <span className="text-sm font-medium">Registrazione Audio</span>
                            </div>

                            <audio
                                ref={audioRef}
                                src={call.recording_url}
                                onTimeUpdate={handleTimeUpdate}
                                onLoadedMetadata={handleLoadedMetadata}
                                onEnded={() => setIsPlaying(false)}
                            />

                            <div className="flex items-center gap-4">
                                {/* Play/Pause Button */}
                                <button
                                    onClick={handlePlayPause}
                                    className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 transition-shadow"
                                >
                                    {isPlaying ? (
                                        <Pause className="w-5 h-5" />
                                    ) : (
                                        <Play className="w-5 h-5 ml-0.5" />
                                    )}
                                </button>

                                {/* Progress Bar */}
                                <div className="flex-1">
                                    <input
                                        type="range"
                                        min={0}
                                        max={duration || 100}
                                        value={currentTime}
                                        onChange={handleSeek}
                                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-violet-500 [&::-webkit-slider-thumb]:to-cyan-500"
                                    />
                                    <div className="flex justify-between text-xs text-white/40 mt-1">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                {/* Mute Button */}
                                <button
                                    onClick={toggleMute}
                                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                                >
                                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI Summary */}
                    {call.summary && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3 text-cyan-400">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-medium">Riepilogo AI</span>
                            </div>
                            <p className="text-white/80 leading-relaxed">
                                {call.summary}
                            </p>
                        </div>
                    )}

                    {/* Transcript - Chat Style */}
                    {(call.transcript_json || call.transcript) && (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-4 text-violet-400">
                                <MessageSquare className="w-4 h-4" />
                                <span className="text-sm font-medium">Conversazione Completa</span>
                            </div>
                            <TranscriptChat
                                transcriptJson={call.transcript_json}
                                transcriptText={call.transcript}
                                maxHeight="350px"
                            />
                        </div>
                    )}

                    {/* Tags */}
                    {call.tags && call.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {call.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/60 text-sm"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Extracted Data (from Retell AI custom_analysis_data) */}
                    {call.custom_analysis_data && Object.keys(call.custom_analysis_data).length > 0 && (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3 text-emerald-400">
                                <FileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Dati Estratti dall'AI</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.entries(call.custom_analysis_data).map(([key, value]) => (
                                    <div key={key} className="bg-white/5 rounded-lg p-3">
                                        <p className="text-white/40 text-xs capitalize mb-1">
                                            {key.replace(/_/g, ' ')}
                                        </p>
                                        <p className="text-white font-medium text-sm">
                                            {String(value) || '-'}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
