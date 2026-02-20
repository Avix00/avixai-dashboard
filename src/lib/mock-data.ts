import { Call, DailyCallsData, KPIData, TagFrequency, SentimentDistribution, CommonQuestion } from './supabase/types';

// TOGGLE MOCK DATA HERE
export const USE_MOCK_DATA = false;

// Mock KPIs
export const MOCK_KPI_DATA: KPIData = {
    totalCalls: 124,
    appointmentsCount: 38,
    timeSavedMinutes: 620, // 124 * 5
    positivePercentage: 85,
    outOfHoursCount: 12,
};

// Mock Daily Calls (Last 7 Days)
export const MOCK_DAILY_CALLS: DailyCallsData[] = [
    { date: 'Lun 12', calls: 15 },
    { date: 'Mar 13', calls: 22 },
    { date: 'Mer 14', calls: 18 },
    { date: 'Gio 15', calls: 30 },
    { date: 'Ven 16', calls: 25 },
    { date: 'Sab 17', calls: 8 },
    { date: 'Dom 18', calls: 6 },
];

// Mock Top Topics
export const MOCK_TOPIC_DATA: TagFrequency[] = [
    { tag: 'Prenotazione', count: 45 },
    { tag: 'Info Prezzi', count: 32 },
    { tag: 'Info Orari', count: 28 },
    { tag: 'Cancellazione', count: 12 },
    { tag: 'Urgenza', count: 8 },
    { tag: 'Reclamo', count: 3 },
];

// Mock Sentiment Distribution
export const MOCK_SENTIMENT_DATA: SentimentDistribution[] = [
    { sentiment: 'Positivo', count: 85, color: '#4ade80' },
    { sentiment: 'Neutro', count: 30, color: '#facc15' },
    { sentiment: 'Negativo', count: 9, color: '#f87171' },
];

// Mock Common Questions
export const MOCK_COMMON_QUESTIONS: CommonQuestion[] = [
    { id: '1', question: 'Quali sono i vostri orari di apertura?', count: 42, last_updated: '2024-02-18T10:00:00Z', user_id: 'mock' },
    { id: '2', question: 'Quanto costa una visita specialistica?', count: 35, last_updated: '2024-02-18T10:00:00Z', user_id: 'mock' },
    { id: '3', question: 'Accettate pagamenti con carta di credito?', count: 28, last_updated: '2024-02-18T10:00:00Z', user_id: 'mock' },
    { id: '4', question: 'C\'è parcheggio nelle vicinanze?', count: 15, last_updated: '2024-02-18T10:00:00Z', user_id: 'mock' },
    { id: '5', question: 'Fate visite a domicilio?', count: 8, last_updated: '2024-02-18T10:00:00Z', user_id: 'mock' },
];

// Mock Calls List (50+ items recommended, generating a subset here)
const generateMockCalls = (count: number): Call[] => {
    const calls: Call[] = [];
    const sentiments = ['positive', 'neutral', 'negative'] as const;
    const statuses = ['completed', 'in-progress', 'missed'] as const;
    const summaries = [
        'Cliente interessato a prenotare una visita per la prossima settimana.',
        'Richiesta informazioni sugli orari di apertura del laboratorio.',
        'Cliente voleva cancellare l\'appuntamento di domani.',
        'Chiamata interrotta, cliente non ha lasciato messaggio.',
        'Conferma appuntamento per il 20/02 alle 15:00.',
        'Richiesta urgente per un intervento tecnico.',
        'Cliente chiede se accettiamo pagamenti rateali.',
        'Lamentela riguardo al tempo di attesa telefonico.',
        'Prenotazione confermata per Mario Rossi.',
        'Richiesta preventivo per servizio completo.'
    ];

    for (let i = 0; i < count; i++) {
        const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        calls.push({
            id: `mock-call-${i}`,
            created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(),
            user_id: 'mock-user',
            customer_number: `+39 3${Math.floor(Math.random() * 100)} ${Math.floor(Math.random() * 1000)} ${Math.floor(Math.random() * 1000)}`,
            status: status,
            duration: Math.floor(Math.random() * 300) + 30, // 30s to 330s
            summary: summaries[Math.floor(Math.random() * summaries.length)],
            transcript: 'Trascrizione di esempio mock...',
            transcript_json: [],
            sentiment: sentiment,
            recording_url: null,
            vapi_call_id: `vapi-mock-${i}`,
            tags: Math.random() > 0.5 ? ['Prenotazione'] : ['Info'],
            location: 'Milano, IT',
            custom_analysis_data: {},
        });
    }
    return calls.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
};

export const MOCK_CALLS = generateMockCalls(50);
