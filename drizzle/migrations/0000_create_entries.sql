CREATE TABLE public.entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  date text NOT NULL,
  region text NOT NULL,
  intensity int NOT NULL DEFAULT 3,
  kind text NOT NULL DEFAULT 'body',
  notes text NOT NULL DEFAULT '',
  factors text[] NOT NULL DEFAULT '{}',
  image text,
  created_at bigint NOT NULL DEFAULT (extract(epoch from now())*1000)::bigint
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entries TO authenticated;
GRANT ALL ON public.entries TO service_role;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.entries FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX entries_user_idx ON public.entries(user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.entries;