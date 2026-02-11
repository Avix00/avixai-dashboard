-- 1. Update RPC function to ACCEPT user_id (no more guessing)
create or replace function increment_common_question(question_text text, p_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- Validate input
  if p_user_id is null then
    raise exception 'User ID is required for multi-tenancy';
  end if;

  insert into common_questions (question, count, updated_at, user_id)
  values (question_text, 1, now(), p_user_id)
  on conflict (question)
  do update set
    count = common_questions.count + 1,
    updated_at = now();
end;
$$;

-- 2. Tighten RLS Policy (Security Upgrade)
-- Drop old permissive policy
DROP POLICY IF EXISTS "Enable read access for all users" ON common_questions;

-- Create strict policies
-- Users can only read their OWN questions
CREATE POLICY "Users can read own questions"
ON common_questions FOR SELECT
USING (auth.uid() = user_id);

-- Service role maintains full access
CREATE POLICY "Service role full access"
ON common_questions
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');
