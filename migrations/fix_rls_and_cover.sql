-- Lilás · Fix RLS: update em comments + storage policies para covers
-- Rodar no SQL Editor do Supabase Dashboard

-- 1) Permitir que autor edite seu próprio comentário
CREATE POLICY "comments update own"
  ON public.comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- 2) Criar bucket 'covers' se não existir (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'covers',
  'covers',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3) Políticas de storage para covers
CREATE POLICY "Cover upload for authenticated users"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public read for covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');

CREATE POLICY "Users can update own covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4) Garantir que profiles tenha cover_url e banner_url
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url text;
