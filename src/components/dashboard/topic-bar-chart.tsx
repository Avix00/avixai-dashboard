'use client';

import { useEffect, useState } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import { supabase } from '@/lib/supabase/client';
import { TagFrequency } from '@/lib/supabase/types';


export function TopicBarChart() {
    const [data, setData] = useState<TagFrequency[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const { data: calls, error } = await supabase
                    .from('calls')
                    .select('tags');

                if (error) throw error;

                // Count tag frequency
                const tagCounts: Record<string, number> = {};
                calls?.forEach((call) => {
                    if (call.tags && Array.isArray(call.tags)) {
                        call.tags.forEach((tag: string) => {
                            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                        });
                    }
                });

                const chartData = Object.entries(tagCounts)
                    .map(([tag, count]) => ({ tag, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 6);

                setData(chartData);
            } catch (err) {
                console.error('Error fetching tag data:', err);
                // No mock data on error either
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    // Luxury: Single flat Tech Indigo color
    const SAPPHIRE_BLUE = '#3B82F6';

    if (loading) {
        return (
            <div className="glass-card p-6 h-[350px] flex items-center justify-center">
                <div className="skeleton w-full h-full" />
            </div>
        );
    }

    return (
        <div className="glass-card p-8">
            <h3 className="text-base font-medium text-[var(--text-muted)] uppercase tracking-wide mb-6">
                Analisi Argomenti
            </h3>
            {data.length === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-white/40">
                    <p className="text-sm">Nessun dato argomenti disponibile</p>
                </div>
            ) : (
                <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                type="number"
                                stroke="#9CA3AF"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <YAxis
                                dataKey="tag"
                                type="category"
                                stroke="#9CA3AF"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={80}
                                tick={{ fill: '#9CA3AF' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(2, 6, 23, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }}
                                labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: '4px' }}
                                formatter={(value) => [`${value ?? 0} chiamate`, 'Conteggio']}
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30} fill={SAPPHIRE_BLUE} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
