ALTER TABLE common_questions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Optional: Update existing rows to have a timestamp
UPDATE common_questions SET updated_at = NOW() WHERE updated_at IS NULL;
