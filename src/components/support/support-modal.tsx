'use client';

import { useState, useRef } from 'react';
import { X, Send, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2, Paperclip } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface SupportModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = e.target.files?.[0];
        if (selected) {
            if (selected.size > 5 * 1024 * 1024) {
                alert('File troppo grande (max 5MB)');
                return;
            }
            setFile(selected);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result as string);
            reader.readAsDataURL(selected);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) return;

        setSending(true);
        setStatus('idle');

        try {
            // Get current user info to attach
            const { data: { user } } = await supabase.auth.getUser();
            const { data: settings } = await supabase
                .from('settings')
                .select('company_name')
                .eq('user_id', user?.id)
                .single();

            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('userEmail', user?.email || 'Animonimo');
            formData.append('companyName', settings?.company_name || 'N/A');

            if (file) {
                formData.append('screenshot', file);
            }

            const res = await fetch('/api/support/send', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to send');

            setStatus('success');
            setTimeout(() => {
                onClose();
                // Reset form
                setTitle('');
                setDescription('');
                setFile(null);
                setPreview(null);
                setStatus('idle');
            }, 2000);

        } catch (error) {
            console.error('Support error:', error);
            setStatus('error');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-slate-900/90 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                            🛟
                        </span>
                        Supporto Tecnico
                    </h3>
                    <button
                        onClick={onClose}
                        disabled={sending}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Status Messages */}
                    {status === 'success' && (
                        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            Segnalazione inviata con successo!
                        </div>
                    )}
                    {status === 'error' && (
                        <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            Errore nell'invio. Riprova più tardi.
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Oggetto</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Es. Problema con il calendario"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                            required
                            disabled={sending}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Descrizione</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Descrivi dettagliatamente il problema..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all min-h-[120px] resize-none"
                            required
                            disabled={sending}
                        />
                    </div>

                    {/* Screenshot Upload */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Screenshot (Opzionale)</label>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                            disabled={sending}
                        />

                        {!preview ? (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                                className="w-full border-2 border-dashed border-white/10 rounded-xl p-4 flex flex-col items-center justify-center gap-2 group hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ImageIcon className="w-5 h-5 text-white/40 group-hover:text-cyan-400" />
                                </div>
                                <span className="text-sm text-white/40 group-hover:text-white/70">Clicca per allegare uno screenshot</span>
                            </button>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden border border-white/10 group">
                                <img src={preview} alt="Preview" className="w-full h-32 object-cover" />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFile(null);
                                        setPreview(null);
                                    }}
                                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-black/50 text-xs text-white backdrop-blur-sm flex items-center gap-1">
                                    <Paperclip className="w-3 h-3" />
                                    {file?.name}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={sending}
                            className="px-4 py-2 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-colors text-sm font-medium"
                        >
                            Annulla
                        </button>
                        <button
                            type="submit"
                            disabled={sending || !title || !description}
                            className={cn(
                                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-cyan-500/20",
                                sending || !title || !description
                                    ? "bg-white/10 text-white/40 cursor-not-allowed"
                                    : "bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-cyan-500/40 hover:scale-[1.02]"
                            )}
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Invio in corso...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    Invia Segnalazione
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
