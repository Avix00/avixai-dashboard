-- Add features_config JSONB column to settings table
-- This stores granular feature toggles for each user

ALTER TABLE settings
ADD COLUMN IF NOT EXISTS features_config JSONB DEFAULT '{
  "dashboard": {
    "enabled": true,
    "kpi_appointments": true,
    "kpi_time_saved": true,
    "kpi_satisfaction": true,
    "chart_calls_7d": true
  },
  "history": {
    "enabled": true,
    "call_list": true
  },
  "insights": {
    "enabled": true,
    "topic_analysis": true,
    "sentiment_distribution": true,
    "common_questions": true
  },
  "agenda": {
    "enabled": true
  }
}'::jsonb;

-- Comment for documentation
COMMENT ON COLUMN settings.features_config IS 'Granular feature toggles per user. Each section can be enabled/disabled independently.';
