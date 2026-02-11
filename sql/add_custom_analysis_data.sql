-- Migration: Add custom_analysis_data column to calls table
-- This stores the extracted data from Retell AI call analysis (e.g., appointment date, customer name, etc.)

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS custom_analysis_data JSONB DEFAULT '{}'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN calls.custom_analysis_data IS 'Stores custom extracted fields from Retell AI call analysis (e.g., appointment_time, customer_name, intent)';
