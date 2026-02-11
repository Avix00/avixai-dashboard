-- Enable RLS on the table (if not already enabled)
ALTER TABLE common_questions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon and authenticated) to READ common questions
-- This is necessary for the dashboard to display the chart
CREATE POLICY "Enable read access for all users"
ON common_questions
FOR SELECT
USING (true);

-- Allow service_role to do everything (just in case)
CREATE POLICY "Enable all access for service role"
ON common_questions
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
