-- Add transcript_json JSONB column to calls table
-- This stores the structured dialogue from Retell (role + content)

ALTER TABLE calls
ADD COLUMN IF NOT EXISTS transcript_json JSONB DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN calls.transcript_json IS 'Structured transcript from Retell. Array of {role: "agent"|"user", content: string, words?: [...]}';
