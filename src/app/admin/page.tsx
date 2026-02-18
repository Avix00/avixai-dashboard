'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Shield, Users, Loader2, Check, UserPlus, ChevronDown, ChevronUp, Sliders, Webhook, Copy, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeaturesConfig, DEFAULT_FEATURES_CONFIG } from '@/lib/supabase/types';

interface UserSettings {
    id: string;
    user_id: string;
    company_name: string;
    is_super_admin: boolean;
    ai_active: boolean;
    features_config: FeaturesConfig | null;
    display_name: string | null;
    office_hours_start: string | null;
    office_hours_end: string | null;
    created_at: string;
}

interface NewUserForm {
    email: string;
    password: string;
    company_name: string;
    display_name: string;
    features_config: FeaturesConfig;
}

export default function AdminPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [users, setUsers] = useState<UserSettings[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        setOrigin(window.location.origin);
    }, []);
    const [creating, setCreating] = useState(false);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showFeaturesPanel, setShowFeaturesPanel] = useState(false);
    const [newUser, setNewUser] = useState<NewUserForm>({
        email: '',
        password: '',
        company_name: '',
        display_name: '',
        features_config: { ...DEFAULT_FEATURES_CONFIG },
    });
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [editingFeatures, setEditingFeatures] = useState<string | null>(null); // user id being edited

    // Toggle Switch Component
    const ToggleSwitch = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
        <label className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer">
            <span className="text-sm text-white/80">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative w-10 h-5 rounded-full transition-colors',
                    checked ? 'bg-cyan-500' : 'bg-white/20'
                )}
            >
                <span className={cn(
                    'absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform',
                    checked && 'translate-x-5'
                )} />
            </button>
        </label>
    );

    // Check if current user is super admin (server-side validation)
    useEffect(() => {
        const checkAuthorization = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push('/login');
                return;
            }

            const isWhitelisted = ['l.loay@avixai.it', 'k.marouane@avixai.it']
                .includes((user.email || '').toLowerCase().trim());

            const { data: settings, error } = await supabase
                .from('settings')
                .select('is_super_admin, user_id')
                .eq('user_id', user.id)
                .single();

            if (!isWhitelisted && (error || !settings?.is_super_admin)) {
                // Not authorized - redirect to dashboard
                setIsAuthorized(false);
                setLoading(false);
                router.push('/dashboard');
                return;
            }

            setIsAuthorized(true);
            fetchAllUsers();
        };

        checkAuthorization();
    }, [router]);

    async function fetchAllUsers() {
        setLoading(true);
        try {
            // Admin can see all settings (RLS should allow this for super_admin)
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setNotification({ type: 'error', message: 'Errore nel caricamento utenti' });
        } finally {
            setLoading(false);
        }
    }

    // State for editing existing user's features
    const [editingUser, setEditingUser] = useState<UserSettings | null>(null);
    const [editFeaturesConfig, setEditFeaturesConfig] = useState<FeaturesConfig>(DEFAULT_FEATURES_CONFIG);
    const [editDisplayName, setEditDisplayName] = useState<string>('');
    const [editOfficeHoursStart, setEditOfficeHoursStart] = useState<string>('09:00');
    const [editOfficeHoursEnd, setEditOfficeHoursEnd] = useState<string>('18:00');

    // Open edit modal for a user
    function openEditModal(user: UserSettings) {
        setEditingUser(user);
        setEditFeaturesConfig(user.features_config || { ...DEFAULT_FEATURES_CONFIG });
        setEditDisplayName(user.display_name || '');
        setEditOfficeHoursStart(user.office_hours_start || '09:00');
        setEditOfficeHoursEnd(user.office_hours_end || '18:00');
    }

    // Save features for existing user
    async function handleSaveFeatures() {
        if (!editingUser) return;
        setSaving(editingUser.id);

        try {
            const { error } = await supabase
                .from('settings')
                .update({
                    features_config: editFeaturesConfig,
                    display_name: editDisplayName || null,
                    office_hours_start: editOfficeHoursStart,
                    office_hours_end: editOfficeHoursEnd
                })
                .eq('id', editingUser.id);

            if (error) throw error;

            setUsers(prev => prev.map(u =>
                u.id === editingUser.id ? { ...u, features_config: editFeaturesConfig } : u
            ));
            setNotification({ type: 'success', message: 'Funzionalità aggiornate!' });
            setEditingUser(null);
        } catch (err) {
            console.error('Error updating features:', err);
            setNotification({ type: 'error', message: 'Errore aggiornamento' });
        } finally {
            setSaving(null);
            setTimeout(() => setNotification(null), 3000);
        }
    }

    async function handleCreateUser() {
        if (!newUser.email || !newUser.password || !newUser.company_name) {
            setNotification({ type: 'error', message: 'Compila tutti i campi' });
            return;
        }

        setCreating(true);
        try {
            // Create user via Supabase Auth (Admin API)
            const response = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to create user');
            }

            setNotification({ type: 'success', message: 'Utente creato con successo!' });
            setShowCreateForm(false);
            setNewUser({ email: '', password: '', company_name: '', display_name: '', features_config: { ...DEFAULT_FEATURES_CONFIG } });
            fetchAllUsers();
        } catch (err: any) {
            console.error('Error creating user:', err);
            setNotification({ type: 'error', message: err.message || 'Errore creazione utente' });
        } finally {
            setCreating(false);
            setTimeout(() => setNotification(null), 5000);
        }
    }

    // Show loading while checking authorization
    if (isAuthorized === null || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    // Not authorized (should redirect, but show message just in case)
    // Not authorized (should redirect, but show message just in case)
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-white">Accesso Negato</h1>
                    <p className="text-white/50 mt-2">Non hai i permessi per accedere a questa pagina.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-8">
            {/* Notification */}
            {notification && (
                <div className={cn(
                    'fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg',
                    notification.type === 'success'
                        ? 'bg-emerald-500/90 text-white'
                        : 'bg-red-500/90 text-white'
                )}>
                    {notification.message}
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Shield className="w-6 h-6 text-cyan-400" />
                            Admin Panel
                        </h1>
                        <p className="text-white/50 mt-1">Gestione utenti e feature flags</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="btn-primary flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        Nuovo Utente
                    </button>
                </div>

                {/* Create User Form */}
                {showCreateForm && (
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-white">Crea Nuovo Utente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={newUser.email}
                                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                className="glass-input"
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newUser.password}
                                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                className="glass-input"
                            />
                            <input
                                type="text"
                                placeholder="Nome Azienda"
                                value={newUser.company_name}
                                onChange={(e) => setNewUser({ ...newUser, company_name: e.target.value })}
                                className="glass-input"
                            />
                            <input
                                type="text"
                                placeholder="Nome Visualizzato (es. Mario)"
                                value={newUser.display_name}
                                onChange={(e) => setNewUser({ ...newUser, display_name: e.target.value })}
                                className="glass-input"
                            />

                        </div>

                        {/* Feature Toggles Section */}
                        <div className="border-t border-white/10 pt-4">
                            <button
                                type="button"
                                onClick={() => setShowFeaturesPanel(!showFeaturesPanel)}
                                className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-medium"
                            >
                                <Sliders className="w-4 h-4" />
                                Personalizza Funzionalità
                                {showFeaturesPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {showFeaturesPanel && (
                                <div className="mt-4 space-y-4 bg-white/5 p-4 rounded-xl">
                                    {/* Dashboard Section */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                            📊 Dashboard
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <ToggleSwitch
                                                label="Appuntamenti Fissati"
                                                checked={newUser.features_config.dashboard.kpi_appointments}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        dashboard: { ...newUser.features_config.dashboard, kpi_appointments: v }
                                                    }
                                                })}
                                            />
                                            <ToggleSwitch
                                                label="Tempo Risparmiato"
                                                checked={newUser.features_config.dashboard.kpi_time_saved}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        dashboard: { ...newUser.features_config.dashboard, kpi_time_saved: v }
                                                    }
                                                })}
                                            />
                                            <ToggleSwitch
                                                label="Clienti Soddisfatti"
                                                checked={newUser.features_config.dashboard.kpi_satisfaction}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        dashboard: { ...newUser.features_config.dashboard, kpi_satisfaction: v }
                                                    }
                                                })}
                                            />
                                            <ToggleSwitch
                                                label="Grafico Chiamate 7gg"
                                                checked={newUser.features_config.dashboard.chart_calls_7d}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        dashboard: { ...newUser.features_config.dashboard, chart_calls_7d: v }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>

                                    {/* History Section */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                            📜 Cronologia
                                        </h4>
                                        <ToggleSwitch
                                            label="Lista Chiamate"
                                            checked={newUser.features_config.history.call_list}
                                            onChange={(v) => setNewUser({
                                                ...newUser,
                                                features_config: {
                                                    ...newUser.features_config,
                                                    history: { ...newUser.features_config.history, call_list: v }
                                                }
                                            })}
                                        />
                                    </div>

                                    {/* Insights Section */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                            🧠 AI Insights
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <ToggleSwitch
                                                label="Analisi Argomenti"
                                                checked={newUser.features_config.insights.topic_analysis}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        insights: { ...newUser.features_config.insights, topic_analysis: v }
                                                    }
                                                })}
                                            />
                                            <ToggleSwitch
                                                label="Distribuzione Sentiment"
                                                checked={newUser.features_config.insights.sentiment_distribution}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        insights: { ...newUser.features_config.insights, sentiment_distribution: v }
                                                    }
                                                })}
                                            />
                                            <ToggleSwitch
                                                label="Domande Frequenti"
                                                checked={newUser.features_config.insights.common_questions}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        insights: { ...newUser.features_config.insights, common_questions: v }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>

                                    {/* Agenda Section */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
                                            📅 Agenda
                                        </h4>
                                        <ToggleSwitch
                                            label="Mostra Agenda"
                                            checked={newUser.features_config.agenda.enabled}
                                            onChange={(v) => setNewUser({
                                                ...newUser,
                                                features_config: {
                                                    ...newUser.features_config,
                                                    agenda: { ...newUser.features_config.agenda, enabled: v }
                                                }
                                            })}
                                        />
                                    </div>

                                    {/* Settings Section (New) */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                                            ⚙️ Impostazioni
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <ToggleSwitch
                                                label="Modifica Orari"
                                                checked={newUser.features_config.settings?.allow_office_hours_edit ?? true}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        settings: {
                                                            ...(newUser.features_config.settings || DEFAULT_FEATURES_CONFIG.settings),
                                                            allow_office_hours_edit: v
                                                        }
                                                    }
                                                })}
                                            />
                                            <ToggleSwitch
                                                label="Configura Calendar"
                                                checked={newUser.features_config.settings?.allow_calendar_config ?? true}
                                                onChange={(v) => setNewUser({
                                                    ...newUser,
                                                    features_config: {
                                                        ...newUser.features_config,
                                                        settings: {
                                                            ...(newUser.features_config.settings || DEFAULT_FEATURES_CONFIG.settings),
                                                            allow_calendar_config: v
                                                        }
                                                    }
                                                })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateUser}
                                disabled={creating}
                                className="btn-primary flex items-center gap-2"
                            >
                                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {creating ? 'Creazione...' : 'Crea Utente'}
                            </button>
                            <button
                                onClick={() => setShowCreateForm(false)}
                                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                )}

                {/* Users Table */}
                <div className="glass-card overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-400" />
                            Utenti ({users.length})
                        </h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">Azienda</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">AI Attiva</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">Funzionalità</th>
                                    <th className="px-4 py-3 text-left text-sm font-medium text-white/70">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5">
                                        <td className="px-4 py-4">
                                            {user.display_name ? (
                                                <>
                                                    <p className="font-medium text-white">{user.display_name}</p>
                                                    <p className="text-xs text-white/50">{user.company_name}</p>
                                                </>
                                            ) : (
                                                <p className="font-medium text-white">{user.company_name || 'N/A'}</p>
                                            )}
                                            <p className="text-[10px] text-white/30 font-mono mt-1">{user.user_id.slice(0, 8)}...</p>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className={cn(
                                                'w-3 h-3 rounded-full inline-block',
                                                user.ai_active ? 'bg-emerald-400' : 'bg-red-400'
                                            )} />
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs text-white/50">
                                                {user.features_config ? '✅ Custom' : '⚙️ Default'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <button
                                                onClick={() => openEditModal(user)}
                                                className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 flex items-center gap-1"
                                            >
                                                <Sliders className="w-3 h-3" />
                                                Modifica
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Edit Features Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="glass-card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-cyan-400" />
                            Modifica Funzionalità - {editingUser.company_name}
                        </h3>

                        {/* Webhook Configuration - Auto Generated */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                <Webhook className="w-4 h-4 text-emerald-400" />
                                Webhook Integrazione
                            </h4>
                            <p className="text-xs text-white/50">Copia questo URL nelle impostazioni di Retell AI.</p>

                            {/* Retell */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-white/50">Retell AI Webhook</span>
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
                                    <code className="text-xs text-cyan-400 flex-1 truncate font-mono">
                                        {origin}/api/retell/webhook?userId={editingUser.user_id}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`${origin}/api/retell/webhook?userId=${editingUser.user_id}`)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                        title="Copia URL"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-white/70" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Check */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-white/50">Calendar Check (Disponibilità)</span>
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
                                    <code className="text-xs text-emerald-400 flex-1 truncate font-mono">
                                        {origin}/api/retell/calendar/check?userId={editingUser.user_id}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`${origin}/api/retell/calendar/check?userId=${editingUser.user_id}`)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                        title="Copia URL"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-white/70" />
                                    </button>
                                </div>
                            </div>

                            {/* Calendar Book */}
                            <div className="flex flex-col gap-1">
                                <span className="text-xs text-white/50">Calendar Book (Prenotazione)</span>
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/5">
                                    <code className="text-xs text-purple-400 flex-1 truncate font-mono">
                                        {origin}/api/retell/calendar/book?userId={editingUser.user_id}
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(`${origin}/api/retell/calendar/book?userId=${editingUser.user_id}`)}
                                        className="p-1 hover:bg-white/10 rounded transition-colors"
                                        title="Copia URL"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-white/70" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Display Name Section */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                👤 Nome Visualizzato
                            </h4>
                            <p className="text-xs text-white/50">Questo nome appare nel saluto della dashboard.</p>
                            <input
                                type="text"
                                placeholder="es. Mario"
                                value={editDisplayName}
                                onChange={(e) => setEditDisplayName(e.target.value)}
                                className="glass-input w-full"
                            />
                        </div>

                        {/* Office Hours Section */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
                            <h4 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Orari di Apertura
                            </h4>
                            <p className="text-xs text-white/50">Usati per calcolare le chiamate fuori orario (KPI).</p>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-white/50 mb-1">Apertura</label>
                                    <input
                                        type="time"
                                        value={editOfficeHoursStart}
                                        onChange={(e) => setEditOfficeHoursStart(e.target.value)}
                                        className="glass-input w-full"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-white/50 mb-1">Chiusura</label>
                                    <input
                                        type="time"
                                        value={editOfficeHoursEnd}
                                        onChange={(e) => setEditOfficeHoursEnd(e.target.value)}
                                        className="glass-input w-full"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dashboard Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">📊 Dashboard</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <ToggleSwitch
                                    label="Appuntamenti Fissati"
                                    checked={editFeaturesConfig.dashboard.kpi_appointments}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, dashboard: { ...editFeaturesConfig.dashboard, kpi_appointments: v } })}
                                />
                                <ToggleSwitch
                                    label="Tempo Risparmiato"
                                    checked={editFeaturesConfig.dashboard.kpi_time_saved}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, dashboard: { ...editFeaturesConfig.dashboard, kpi_time_saved: v } })}
                                />
                                <ToggleSwitch
                                    label="Clienti Soddisfatti"
                                    checked={editFeaturesConfig.dashboard.kpi_satisfaction}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, dashboard: { ...editFeaturesConfig.dashboard, kpi_satisfaction: v } })}
                                />
                                <ToggleSwitch
                                    label="Grafico Chiamate 7gg"
                                    checked={editFeaturesConfig.dashboard.chart_calls_7d}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, dashboard: { ...editFeaturesConfig.dashboard, chart_calls_7d: v } })}
                                />
                            </div>
                        </div>

                        {/* History Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-violet-400 flex items-center gap-2">📜 Cronologia</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <ToggleSwitch
                                    label="Pagina Cronologia"
                                    checked={editFeaturesConfig.history.enabled}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, history: { ...editFeaturesConfig.history, enabled: v } })}
                                />
                                <ToggleSwitch
                                    label="Lista Chiamate"
                                    checked={editFeaturesConfig.history.call_list}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, history: { ...editFeaturesConfig.history, call_list: v } })}
                                />
                            </div>
                        </div>

                        {/* Insights Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-blue-400 flex items-center gap-2">🧠 AI Insights</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <ToggleSwitch
                                    label="Pagina Insights"
                                    checked={editFeaturesConfig.insights.enabled}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, insights: { ...editFeaturesConfig.insights, enabled: v } })}
                                />
                                <ToggleSwitch
                                    label="Analisi Argomenti"
                                    checked={editFeaturesConfig.insights.topic_analysis}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, insights: { ...editFeaturesConfig.insights, topic_analysis: v } })}
                                />
                                <ToggleSwitch
                                    label="Distribuzione Sentiment"
                                    checked={editFeaturesConfig.insights.sentiment_distribution}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, insights: { ...editFeaturesConfig.insights, sentiment_distribution: v } })}
                                />
                                <ToggleSwitch
                                    label="Domande Frequenti"
                                    checked={editFeaturesConfig.insights.common_questions}
                                    onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, insights: { ...editFeaturesConfig.insights, common_questions: v } })}
                                />
                            </div>
                        </div>

                        {/* Agenda Section */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">📅 Agenda</h4>
                            <ToggleSwitch
                                label="Pagina Agenda"
                                checked={editFeaturesConfig.agenda.enabled}
                                onChange={(v) => setEditFeaturesConfig({ ...editFeaturesConfig, agenda: { ...editFeaturesConfig.agenda, enabled: v } })}
                            />
                        </div>

                        {/* Settings Section (New) */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">⚙️ Impostazioni</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <ToggleSwitch
                                    label="Modifica Orari"
                                    checked={editFeaturesConfig.settings?.allow_office_hours_edit ?? true}
                                    onChange={(v) => setEditFeaturesConfig({
                                        ...editFeaturesConfig,
                                        settings: {
                                            ...(editFeaturesConfig.settings || DEFAULT_FEATURES_CONFIG.settings),
                                            allow_office_hours_edit: v
                                        }
                                    })}
                                />
                                <ToggleSwitch
                                    label="Configura Calendar"
                                    checked={editFeaturesConfig.settings?.allow_calendar_config ?? true}
                                    onChange={(v) => setEditFeaturesConfig({
                                        ...editFeaturesConfig,
                                        settings: {
                                            ...(editFeaturesConfig.settings || DEFAULT_FEATURES_CONFIG.settings),
                                            allow_calendar_config: v
                                        }
                                    })}
                                />
                            </div>
                        </div>

                        {/* Modal Actions */}
                        <div className="flex gap-3 pt-4 border-t border-white/10">
                            <button
                                onClick={handleSaveFeatures}
                                disabled={saving === editingUser.id}
                                className="btn-primary flex items-center gap-2"
                            >
                                {saving === editingUser.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                {saving === editingUser.id ? 'Salvataggio...' : 'Salva Modifiche'}
                            </button>
                            <button
                                onClick={() => setEditingUser(null)}
                                className="px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20"
                            >
                                Annulla
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
