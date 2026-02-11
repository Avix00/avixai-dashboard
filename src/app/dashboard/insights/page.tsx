'use client';

export const dynamic = 'force-dynamic';

import { Brain } from 'lucide-react';
import { TopicBarChart } from '@/components/dashboard/topic-bar-chart';
import { SentimentDonutChart } from '@/components/dashboard/sentiment-donut';
import { CommonQuestionsChart } from '@/components/dashboard/common-questions-chart';
import { useFeatures } from '@/hooks/useFeatures';

export default function InsightsPage() {
    const { showTopicAnalysis, showSentimentDistribution, showCommonQuestions } = useFeatures();

    // Check if any charts are visible
    const hasAnyChart = showTopicAnalysis || showSentimentDistribution || showCommonQuestions;

    return (
        <div className="space-y-6 fade-in">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Brain className="w-6 h-6 text-blue-400" />
                    AI Insights
                </h1>
                <p className="text-white/50 mt-1">
                    Analisi avanzata delle tue chiamate
                </p>
            </div>

            {/* Charts Grid - Conditionally rendered */}
            {(showTopicAnalysis || showSentimentDistribution) && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {showTopicAnalysis && <TopicBarChart />}
                    {showSentimentDistribution && <SentimentDonutChart />}
                </div>
            )}

            {/* Common Questions Chart - Conditionally rendered */}
            {showCommonQuestions && <CommonQuestionsChart />}

            {/* Empty state if nothing is visible */}
            {!hasAnyChart && (
                <div className="glass-card p-8 text-center">
                    <p className="text-white/50">Nessun grafico abilitato per questo account.</p>
                </div>
            )}
        </div>
    );
}
