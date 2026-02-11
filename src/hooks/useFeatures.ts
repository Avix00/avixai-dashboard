'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { FeaturesConfig, DEFAULT_FEATURES_CONFIG } from '@/lib/supabase/types';

export interface Features {
    // Page-level visibility (for sidebar)
    showDashboard: boolean;
    showHistory: boolean;
    showInsights: boolean;
    showAgenda: boolean;

    // Dashboard components
    showKPIAppointments: boolean;
    showKPITimeSaved: boolean;
    showKPISatisfaction: boolean;
    showChartCalls7d: boolean;

    // History components
    showCallList: boolean;

    // Insights components
    showTopicAnalysis: boolean;
    showSentimentDistribution: boolean;
    showCommonQuestions: boolean;

    // Legacy flags (kept for backward compat)
    showGCal: boolean;
    isB2BSupport: boolean;
    isSuperAdmin: boolean;
    companyName?: string;
    isLoading: boolean;

    // Settings Control
    allowOfficeHoursEdit: boolean;
    allowCalendarConfig: boolean;

    // Dynamic Welcome Message
    displayName?: string;
    visitCount: number;

    // Office Hours (for Out of Hours KPI)
    officeHoursStart: string;
    officeHoursEnd: string;
}

/**
 * Fetches feature flags from the user's settings.
 * Supports granular features_config or falls back to business_type logic.
 */
export function useFeatures(): Features {
    const [features, setFeatures] = useState<Features>({
        showDashboard: true,
        showHistory: true,
        showInsights: true,
        showAgenda: true,
        showKPIAppointments: true,
        showKPITimeSaved: true,
        showKPISatisfaction: true,
        showChartCalls7d: true,
        showCallList: true,
        showTopicAnalysis: true,
        showSentimentDistribution: true,
        showCommonQuestions: true,
        showGCal: true,
        isB2BSupport: false,
        isSuperAdmin: false,
        companyName: undefined,
        isLoading: true,
        allowOfficeHoursEdit: true,
        allowCalendarConfig: true,
        displayName: undefined,
        visitCount: 0,
        officeHoursStart: '09:00',
        officeHoursEnd: '18:00',
    });

    useEffect(() => {
        const fetchFeatures = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                setFeatures(prev => ({ ...prev, isLoading: false }));
                return;
            }

            const isWhitelisted = ['l.loay@avixai.it', 'k.marouane@avixai.it']
                .includes((user.email || '').toLowerCase().trim());

            const { data: settings, error } = await supabase
                .from('settings')
                .select('is_super_admin, company_name, features_config, display_name, visit_count, office_hours_start, office_hours_end')
                .eq('user_id', user.id)
                .single();

            if (error) {
                console.warn('[useFeatures] Error fetching settings:', error.message);
            }

            if (settings) {
                // Get features config (or use defaults)
                const config: FeaturesConfig = settings.features_config || DEFAULT_FEATURES_CONFIG;
                // isB2BSupport removed as business_type column is deleted (default false)

                setFeatures({
                    // Page-level
                    showDashboard: config.dashboard?.enabled ?? true,
                    showHistory: config.history?.enabled ?? true,
                    showInsights: config.insights?.enabled ?? true,
                    showAgenda: config.agenda?.enabled ?? true, // Only controlled by toggle now

                    // Dashboard components
                    showKPIAppointments: config.dashboard?.kpi_appointments ?? true,
                    showKPITimeSaved: config.dashboard?.kpi_time_saved ?? true,
                    showKPISatisfaction: config.dashboard?.kpi_satisfaction ?? true,
                    showChartCalls7d: config.dashboard?.chart_calls_7d ?? true,

                    // History
                    showCallList: config.history?.call_list ?? true,

                    // Insights
                    showTopicAnalysis: config.insights?.topic_analysis ?? true,
                    showSentimentDistribution: config.insights?.sentiment_distribution ?? true,
                    showCommonQuestions: config.insights?.common_questions ?? true,

                    // Legacy
                    showGCal: true,
                    isB2BSupport: false,
                    isSuperAdmin: settings.is_super_admin === true || isWhitelisted,
                    companyName: settings.company_name,
                    isLoading: false,

                    // Settings Control
                    allowOfficeHoursEdit: config.settings?.allow_office_hours_edit ?? true,
                    allowCalendarConfig: config.settings?.allow_calendar_config ?? true,

                    // Dynamic Welcome Message
                    displayName: settings.display_name || undefined,
                    visitCount: settings.visit_count || 0,

                    // Office Hours
                    officeHoursStart: settings.office_hours_start || '09:00',
                    officeHoursEnd: settings.office_hours_end || '18:00',
                });
            } else {
                setFeatures(prev => ({
                    ...prev,
                    isLoading: false,
                    isSuperAdmin: isWhitelisted // Still applying whitelist even if DB fetch fails
                }));
            }
        };

        fetchFeatures();
    }, []);

    return features;
}

