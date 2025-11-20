-- Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Políticas RLS para el bucket de imágenes de productos

-- Permitir que todos vean las imágenes (bucket público)
CREATE POLICY "Las imágenes de productos son públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Solo admins pueden subir imágenes
CREATE POLICY "Solo admins pueden subir imágenes de productos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- Solo admins pueden actualizar imágenes
CREATE POLICY "Solo admins pueden actualizar imágenes de productos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);

-- Solo admins pueden eliminar imágenes
CREATE POLICY "Solo admins pueden eliminar imágenes de productos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' 
  AND auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
  )
);