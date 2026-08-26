-- Criar bucket de avatars no Supabase Storage
-- Execute este script no SQL Editor do Supabase Dashboard

-- 1. Criar o bucket (público para leitura)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Policy: usuários autenticados podem fazer upload
CREATE POLICY "Avatar upload for authenticated users"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. Policy: qualquer pessoa pode ler avatares (bucket público)
CREATE POLICY "Public read for avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

-- 4. Policy: usuários podem deletar/atualizar seus próprios avatares
CREATE POLICY "Users can update own avatar"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
