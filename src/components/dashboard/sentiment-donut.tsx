'use client';

import { useEffect, useState } from 'react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { USE_MOCK_DATA, MOCK_SENTIMENT_DATA } from '@/lib/mock-data';

// Luxury: Softer/Desaturated Sentiment Colors (no "1990s traffic light")
const SENTIMENT_COLORS: Record<string, { label: string; color: string }> = {
    positive: { label: 'Positivo', color: '#4ade80' }, // Soft Green
    neutral: { label: 'Neutro', color: '#facc15' },  // Soft Yellow
    negative: { label: 'Negativo', color: '#f87171' }, // Soft Red
};

// Using a type with index signature for Recharts compatibility
type ChartData = {
    sentiment: string;
    count: number;
    color: string;
    [key: string]: string | number;
};


export function SentimentDonutChart() {
    const router = useRouter();
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    const handlePieClick = (data: any) => {
        if (data && data.sentiment) {
            let sentimentKey = 'positive';
            if (data.sentiment === 'Neutro') sentimentKey = 'neutral';
            if (data.sentiment === 'Negativo') sentimentKey = 'negative';

            router.push(`/dashboard/history?sentiment=${sentimentKey}`);
        }
    };

    useEffect(() => {


        async function fetchData() {
            try {
                if (USE_MOCK_DATA) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const total = MOCK_SENTIMENT_DATA.reduce((acc, curr) => acc + curr.count, 0);
                    // Map to satisfy ChartData type (needs index signature)
                    const mappedData: ChartData[] = MOCK_SENTIMENT_DATA.map(item => ({
                        ...item
                    }));
                    setData(mappedData);
                    setTotal(total);
                    setLoading(false);
                    return;
                }

                const { data: calls, error } = await supabase
                    .from('calls')
                    .select('sentiment')
                    .not('sentiment', 'is', null);

                if (error) throw error;

                // Count sentiment distribution
                const sentimentCounts: Record<string, number> = {
                    positive: 0,
                    neutral: 0,
                    negative: 0,
                };

                calls?.forEach((call) => {
                    if (call.sentiment && sentimentCounts[call.sentiment] !== undefined) {
                        sentimentCounts[call.sentiment]++;
                    }
                });

                const chartData = Object.entries(sentimentCounts)
                    .filter(([_, count]) => count > 0)
                    .map(([sentiment, count]) => ({
                        sentiment: SENTIMENT_COLORS[sentiment].label,
                        count,
                        color: SENTIMENT_COLORS[sentiment].color,
                    }));

                setData(chartData);
                setTotal(calls?.length || 0);
            } catch (err) {
                console.error('Error fetching sentiment data:', err);
                // No mock data on error either
                setData([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

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
                Distribuzione Sentiment
            </h3>
            {total === 0 ? (
                <div className="h-[280px] flex flex-col items-center justify-center text-white/40">
                    <p className="text-sm">Nessun dato sentiment disponibile</p>
                </div>
            ) : (
                <div className="h-[280px] relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={3}
                                dataKey="count"
                                nameKey="sentiment"
                                onClick={handlePieClick}
                                className="cursor-pointer outline-none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    background: 'rgba(2, 6, 23, 0.9)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                                }}
                                labelStyle={{ color: 'rgba(255,255,255,0.7)' }}
                                formatter={(value, name) => {
                                    const numValue = Number(value) || 0;
                                    return [
                                        `${numValue} (${Math.round((numValue / total) * 100)}%)`,
                                        name,
                                    ];
                                }}
                            />
                            <Legend
                                formatter={(value) => (
                                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>{value}</span>
                                )}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label - Luxury Typography */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <p className="text-4xl font-light text-white tracking-tight">{total}</p>
                        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Totale</p>
                    </div>
                </div>
            )}
        </div>
    );
}
