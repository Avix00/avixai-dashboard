-- Add unique constraint to question column to allow ON CONFLICT Upsert
ALTER TABLE common_questions
ADD CONSTRAINT common_questions_question_key UNIQUE (question);
