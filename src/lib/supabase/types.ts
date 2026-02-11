// Database types for Supabase tables

export type CallStatus = 'completed' | 'in-progress' | 'missed';
export type Sentiment = 'positive' | 'neutral' | 'negative';

// Structured transcript item from Retell
export interface TranscriptItem {
  role: 'agent' | 'user';
  content: string;
  words?: Array<{ word: string; start: number; end: number }>;
}

export interface Call {
  id: string;
  created_at: string;
  user_id: string; // Added for RLS
  customer_number: string | null;
  status: CallStatus;
  duration: number;
  summary: string | null;
  transcript: string | null; // Full conversation transcript (raw Q&A)
  transcript_json: TranscriptItem[] | null; // Structured dialogue (role + content)
  sentiment: Sentiment | null;
  recording_url: string | null;
  vapi_call_id: string | null;
  tags: string[];
  location: string | null;
  custom_analysis_data: Record<string, unknown> | null; // Retell extracted fields (appointment_time, customer_name, etc.)
}

export interface Settings {
  id: string;
  user_id: string;
  company_name: string;
  office_hours_start: string;
  office_hours_end: string;
  notification_email: string | null;
  ai_active: boolean;
  // Legacy field (kept for fallback)
  google_calendar_id: string | null;
  // OAuth fields
  google_refresh_token: string | null;
  google_access_token: string | null;
  google_calendar_email: string | null;
  calendar_connected: boolean;
  // Feature Flags
  business_type: 'booking' | 'b2b_support' | null; // null defaults to 'booking'
  is_super_admin: boolean; // For /admin access
  // Granular Feature Control
  features_config: FeaturesConfig | null;
  created_at: string;
  updated_at: string;
}

// Granular Feature Configuration
export interface FeaturesConfig {
  dashboard: {
    enabled: boolean;
    kpi_appointments: boolean;
    kpi_time_saved: boolean;
    kpi_satisfaction: boolean;
    chart_calls_7d: boolean;
  };
  history: {
    enabled: boolean;
    call_list: boolean;
  };
  insights: {
    enabled: boolean;
    topic_analysis: boolean;
    sentiment_distribution: boolean;
    common_questions: boolean;
  };
  agenda: {
    enabled: boolean;
  };
  settings: {
    allow_office_hours_edit: boolean;
    allow_calendar_config: boolean;
  };
}

// Default features config (all enabled)
export const DEFAULT_FEATURES_CONFIG: FeaturesConfig = {
  dashboard: {
    enabled: true,
    kpi_appointments: true,
    kpi_time_saved: true,
    kpi_satisfaction: true,
    chart_calls_7d: true,
  },
  history: {
    enabled: true,
    call_list: true,
  },
  insights: {
    enabled: true,
    topic_analysis: true,
    sentiment_distribution: true,
    common_questions: true,
  },
  agenda: {
    enabled: true,
  },
  settings: {
    allow_office_hours_edit: true,
    allow_calendar_config: true,
  },
};

// Database schema type
export interface Database {
  public: {
    Tables: {
      calls: {
        Row: Call;
        Insert: Omit<Call, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Omit<Call, 'id'>>;
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Settings, 'id' | 'user_id'>>;
      };
    };
  };
}

// KPI types
export interface KPIData {
  totalCalls: number;
  appointmentsCount: number;
  timeSavedMinutes: number;
  positivePercentage: number;
  outOfHoursCount: number;
}

// Chart data types
export interface DailyCallsData {
  date: string;
  calls: number;
}

export interface TagFrequency {
  tag: string;
  count: number;
}

export interface SentimentDistribution {
  sentiment: string;
  count: number;
  color: string;
}

export interface LocationCount {
  location: string;
  count: number;
}

// Common Questions (n8n populated)
export interface CommonQuestion {
  id: string;
  question: string;
  count: number;
  last_updated: string;
  user_id: string;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  attendeeEmail?: string;
  attendeeName?: string;
  attendeePhone?: string;
  description?: string;
  // Linked call data (if matched)
  call_id?: string;
  call_summary?: string;
  call_sentiment?: Sentiment | null;
  call_recording_url?: string;
  call_duration?: number;
  call_transcript?: string | null;
  call_transcript_json?: TranscriptItem[] | null;
  // Metadata
  isAvixBooking: boolean;
  googleEventId: string;
}

export interface CalendarEventResponse {
  events: CalendarEvent[];
  error?: string;
}
