import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with Tailwind merge
export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Format duration from seconds to "Xm Ys" or "X:YY"
export function formatDuration(seconds: number | null): string {
    if (!seconds || seconds === 0) return '--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

// Format phone number for display
export function formatPhoneNumber(phone: string | null): string {
    if (!phone) return 'Numero sconosciuto';
    return phone;
}

// Get country from phone prefix
export function getCountryFromPhone(phone: string): string | null {
    const prefixMap: Record<string, string> = {
        '+39': 'Italy',
        '+1': 'USA',
        '+44': 'UK',
        '+49': 'Germany',
        '+33': 'France',
        '+34': 'Spain',
        '+41': 'Switzerland',
        '+43': 'Austria',
        '+31': 'Netherlands',
        '+32': 'Belgium',
        '+351': 'Portugal',
        '+48': 'Poland',
        '+46': 'Sweden',
        '+47': 'Norway',
        '+45': 'Denmark',
        '+358': 'Finland',
        '+30': 'Greece',
        '+420': 'Czech Republic',
        '+36': 'Hungary',
        '+40': 'Romania',
        '+7': 'Russia',
        '+86': 'China',
        '+81': 'Japan',
        '+82': 'South Korea',
        '+91': 'India',
        '+61': 'Australia',
        '+55': 'Brazil',
        '+52': 'Mexico',
        '+54': 'Argentina',
    };

    for (const [prefix, country] of Object.entries(prefixMap)) {
        if (phone.startsWith(prefix)) {
            return country;
        }
    }
    return null;
}

// Get ISO country code for flags
export function getCountryCode(country: string | null): string {
    if (!country) return 'UN';

    const countryCodeMap: Record<string, string> = {
        'Italy': 'IT',
        'USA': 'US',
        'UK': 'GB',
        'Germany': 'DE',
        'France': 'FR',
        'Spain': 'ES',
        'Switzerland': 'CH',
        'Austria': 'AT',
        'Netherlands': 'NL',
        'Belgium': 'BE',
        'Portugal': 'PT',
        'Poland': 'PL',
        'Sweden': 'SE',
        'Norway': 'NO',
        'Denmark': 'DK',
        'Finland': 'FI',
        'Greece': 'GR',
        'Czech Republic': 'CZ',
        'Hungary': 'HU',
        'Romania': 'RO',
        'Russia': 'RU',
        'China': 'CN',
        'Japan': 'JP',
        'South Korea': 'KR',
        'India': 'IN',
        'Australia': 'AU',
        'Brazil': 'BR',
        'Mexico': 'MX',
        'Argentina': 'AR',
    };

    return countryCodeMap[country] || 'UN';
}

// Format date to Italian locale
export function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Format relative time in Italian
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ora';
    if (diffMins < 60) return `${diffMins}m fa`;
    if (diffHours < 24) return `${diffHours}h fa`;
    if (diffDays < 7) return `${diffDays}g fa`;

    return formatDate(dateString);
}

// Get sentiment color
export function getSentimentColor(sentiment: string | null): string {
    switch (sentiment) {
        case 'positive':
            return 'text-emerald-400';
        case 'negative':
            return 'text-red-400';
        case 'neutral':
            return 'text-amber-400';
        default:
            return 'text-slate-400';
    }
}

// Get sentiment label in Italian
export function getSentimentLabel(sentiment: string | null): string {
    switch (sentiment) {
        case 'positive':
            return 'Positivo';
        case 'negative':
            return 'Negativo';
        case 'neutral':
            return 'Neutro';
        default:
            return 'In attesa';
    }
}

// Get status color
export function getStatusColor(status: string): string {
    switch (status) {
        case 'completed':
            return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        case 'in-progress':
            return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
        case 'missed':
            return 'bg-red-500/20 text-red-400 border-red-500/30';
        default:
            return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
}

// Get status label in Italian
export function getStatusLabel(status: string): string {
    switch (status) {
        case 'completed':
            return 'Completata';
        case 'in-progress':
            return 'In corso';
        case 'missed':
            return 'Persa';
        default:
            return status;
    }
}

// Auto-tagging logic based on summary
export function generateTags(summary: string | null): string[] {
    if (!summary) return [];

    const tags: string[] = [];
    const lowerSummary = summary.toLowerCase();

    // Preventivo keywords
    if (lowerSummary.includes('prezzo') ||
        lowerSummary.includes('costo') ||
        lowerSummary.includes('euro') ||
        lowerSummary.includes('preventivo') ||
        lowerSummary.includes('quanto')) {
        tags.push('preventivo');
    }

    // Supporto keywords
    if (lowerSummary.includes('rotto') ||
        lowerSummary.includes('problema') ||
        lowerSummary.includes('guasto') ||
        lowerSummary.includes('non funziona') ||
        lowerSummary.includes('supporto') ||
        lowerSummary.includes('aiuto')) {
        tags.push('supporto');
    }

    // Appuntamento keywords
    if (lowerSummary.includes('appuntamento') ||
        lowerSummary.includes('fissare') ||
        lowerSummary.includes('prenotare') ||
        lowerSummary.includes('incontro') ||
        lowerSummary.includes('visita')) {
        tags.push('appuntamento');
    }

    return tags;
}
