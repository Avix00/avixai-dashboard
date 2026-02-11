-- Update function to handle user_id automatically
-- This is necessary because n8n calls are anonymous but the table requires a user_id
create or replace function increment_common_question(question_text text)
returns void
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
begin
  -- Try to get the user ID from the current session (if authenticated)
  target_user_id := auth.uid();
  
  -- If not authenticated (e.g. n8n anon call), get the first user from the system
  if target_user_id is null then
    select id into target_user_id from auth.users limit 1;
  end if;

  -- Verify we found a user
  if target_user_id is null then
    raise exception 'No user found in auth.users to assign to question';
  end if;

  -- Perform the upsert with the found user_id
  insert into common_questions (question, count, updated_at, user_id)
  values (question_text, 1, now(), target_user_id)
  on conflict (question)
  do update set
    count = common_questions.count + 1,
    updated_at = now();
end;
$$;
