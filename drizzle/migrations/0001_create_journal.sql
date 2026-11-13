CREATE TABLE public.journal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  date text NOT NULL,
  text text NOT NULL DEFAULT '',
  gratitude text[] NOT NULL DEFAULT '{}',
  moods text[] NOT NULL DEFAULT '{}',
  image text,
  created_at bigint NOT NULL DEFAULT ((EXTRACT(epoch FROM now()) * 1000))::bigint
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal TO authenticated;
GRANT ALL ON public.journal TO service_role;
ALTER TABLE public.journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.journal FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.journal FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.journal FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.journal FOR DELETE TO authenticated USING (auth.uid() = user_id);