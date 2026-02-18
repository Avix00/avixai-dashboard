'use client';

import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { DailyCallsData } from '@/lib/supabase/types';
import { ChartSkeleton } from '@/components/shared/loading-skeleton';
import { USE_MOCK_DATA, MOCK_DAILY_CALLS } from '@/lib/mock-data';

export function CallsChart() {
    const [data, setData] = useState<DailyCallsData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {


            try {
                if (USE_MOCK_DATA) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    setData(MOCK_DAILY_CALLS);
                    setLoading(false);
                    return;
                }

                // Get calls from last 7 days
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
                sevenDaysAgo.setHours(0, 0, 0, 0);

                const { data: calls, error } = await supabase
                    .from('calls')
                    .select('created_at')
                    .gte('created_at', sevenDaysAgo.toISOString())
                    .order('created_at', { ascending: true });

                if (error) throw error;

                // Group by date
                const grouped: Record<string, number> = {};

                // Initialize all 7 days
                for (let i = 0; i < 7; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - (6 - i));
                    const key = date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
                    grouped[key] = 0;
                }

                // Count calls per day
                calls?.forEach((call) => {
                    const date = new Date(call.created_at);
                    const key = date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' });
                    if (grouped[key] !== undefined) {
                        grouped[key]++;
                    }
                });

                if (grouped && Object.keys(grouped).length > 0) {
                    const chartData = Object.entries(grouped).map(([date, calls]) => ({
                        date,
                        calls,
                    }));
                    setData(chartData);
                }
            } catch (err) {
                console.error('Error fetching chart data:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    if (loading) {
        return <ChartSkeleton />;
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-6">
                Chiamate Ultimi 7 Giorni
            </h3>
            <div className="h-[500px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis
                            dataKey="date"
                            stroke="#9CA3AF"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                background: 'rgba(2, 6, 23, 0.9)',
                                border: '1px solid rgba(59,130,246,0.2)',
                                borderRadius: '12px',
                                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                            }}
                            labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
                            itemStyle={{ color: '#3B82F6' }}
                            formatter={(value) => [`${value ?? 0} chiamate`, 'Totale']}
                        />
                        <Area
                            type="monotone"
                            dataKey="calls"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorCalls)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
