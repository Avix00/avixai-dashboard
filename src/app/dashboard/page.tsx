'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { Phone, Clock, TrendingUp, PhoneIncoming } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { KPICard } from '@/components/dashboard/kpi-card';
import { CallsChart } from '@/components/dashboard/calls-chart';
import { KPICardSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { formatDuration } from '@/lib/utils';
import { KPIData } from '@/lib/supabase/types';
import { useFeatures } from '@/hooks/useFeatures';
import { USE_MOCK_DATA, MOCK_KPI_DATA } from '@/lib/mock-data';

export default function DashboardPage() {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEmpty, setIsEmpty] = useState(false);

    // Feature flags for conditional rendering
    const {
        showKPIAppointments,
        showKPITimeSaved,
        showKPISatisfaction,
        showChartCalls7d,
        officeHoursStart,
        officeHoursEnd
    } = useFeatures();


    useEffect(() => {
        async function fetchKPIs() {
            try {
                if (USE_MOCK_DATA) {
                    // Simulate network delay
                    await new Promise(resolve => setTimeout(resolve, 800));
                    setKpiData(MOCK_KPI_DATA);
                    setLoading(false);
                    return;
                }

                // Get total calls count with created_at for out of hours calc
                const { count: totalCalls, error: countError, data: allCalls } = await supabase
                    .from('calls')
                    .select('tags, duration, sentiment, status, created_at', { count: 'exact' });

                if (countError) throw countError;

                if (!totalCalls || totalCalls === 0) {
                    setIsEmpty(true);
                    setLoading(false);
                    return;
                }

                // 1. Calculate Appointments (Conversion)
                // Filter calls that have 'Prenotazione' tag
                const appointmentsCount = allCalls?.filter(c =>
                    c.tags && Array.isArray(c.tags) && c.tags.includes('Prenotazione')
                ).length || 0;

                // 2. Calculate Time Saved
                // Logic: Each call saves approx 5 minutes of human time
                const timeSavedMinutes = totalCalls * 5;

                // 3. Get positive sentiment percentage
                const { count: positiveCount, error: positiveError } = await supabase
                    .from('calls')
                    .select('*', { count: 'exact', head: true })
                    .eq('sentiment', 'positive');

                if (positiveError) throw positiveError;

                const positivePercentage = totalCalls > 0
                    ? Math.round(((positiveCount || 0) / totalCalls) * 100)
                    : 0;

                // 4. Calculate Out of Hours Calls
                const outOfHoursCount = allCalls?.filter(call => {
                    const callDate = new Date(call.created_at);
                    const callTime = callDate.getHours() * 60 + callDate.getMinutes();
                    const [startH, startM] = officeHoursStart.split(':').map(Number);
                    const [endH, endM] = officeHoursEnd.split(':').map(Number);
                    const startMinutes = startH * 60 + startM;
                    const endMinutes = endH * 60 + endM;
                    return callTime < startMinutes || callTime >= endMinutes;
                }).length || 0;

                setKpiData({
                    totalCalls: totalCalls || 0,
                    appointmentsCount,
                    timeSavedMinutes,
                    positivePercentage,
                    outOfHoursCount,
                });
            } catch (err) {
                console.error('Error fetching KPIs:', err);
                setIsEmpty(true);
            } finally {
                setLoading(false);
            }
        }

        fetchKPIs();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                    <KPICardSkeleton />
                </div>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="space-y-6">
                <EmptyState
                    title="In attesa di dati..."
                    description="Non ci sono ancora chiamate registrate. Appariranno qui quando saranno disponibili dati."
                />
            </div>
        );
    }

    // Helper to format hours/minutes
    const formatTimeSaved = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        if (h > 0) return `${h}h ${m}m`;
        return `${m} min`;
    };

    // Check if any KPIs are visible
    const hasVisibleKPIs = showKPIAppointments || showKPITimeSaved || showKPISatisfaction;

    return (
        <div className="space-y-6 fade-in">
            {/* Page Header - Removed */}

            {/* KPI Cards (ROI Focused) - Conditionally rendered */}
            {hasVisibleKPIs && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. Appointments (Conversion) */}
                    {showKPIAppointments && (
                        <div className="stagger-1 fade-in">
                            <KPICard
                                title="Appuntamenti Fissati"
                                value={kpiData?.appointmentsCount || 0}
                                subtitle={`${Math.round(((kpiData?.appointmentsCount || 0) / (kpiData?.totalCalls || 1)) * 100)}% tasso di conversione`}
                                icon={Clock}
                                accentColor="violet"
                            />
                        </div>
                    )}

                    {/* 2. Time Saved (Value) */}
                    {showKPITimeSaved && (
                        <div className="stagger-2 fade-in">
                            <KPICard
                                title="Tempo Risparmiato"
                                value={formatTimeSaved(kpiData?.timeSavedMinutes || 0)}
                                subtitle="Stima su gestione manuale"
                                icon={TrendingUp}
                                accentColor="cyan"
                            />
                        </div>
                    )}

                    {/* 3. Sentiment (Quality) */}
                    {showKPISatisfaction && (
                        <div className="stagger-3 fade-in">
                            <KPICard
                                title="Clienti Soddisfatti"
                                value={`${kpiData?.positivePercentage || 0}%`}
                                subtitle="Sentiment positivo"
                                icon={Phone}
                                accentColor="emerald"
                            />
                        </div>
                    )}

                    {/* 4. Out of Hours Calls (Rescued) */}
                    <div className="stagger-4 fade-in">
                        <KPICard
                            title="Chiamate Fuori Orario"
                            value={kpiData?.outOfHoursCount || 0}
                            subtitle="Opportunità recuperate"
                            icon={PhoneIncoming}
                            accentColor="amber"
                        />
                    </div>
                </div>
            )}

            {/* Chart - Conditionally rendered */}
            {showChartCalls7d && (
                <div className="stagger-4 fade-in">
                    <CallsChart />
                </div>
            )}
        </div>
    );
}

