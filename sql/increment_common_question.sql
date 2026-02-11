-- Create a function to increment the count of a common question
-- This is used by n8n automation to atomically update question stats
create or replace function increment_common_question(question_text text)
returns void
language plpgsql
security definer
as $$
begin
  insert into common_questions (question, count, updated_at)
  values (question_text, 1, now())
  on conflict (question)
  do update set
    count = common_questions.count + 1,
    updated_at = now();
end;
$$;
