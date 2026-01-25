-- Agregar restricción de unicidad al nombre de club
-- Fase 1: Fundamentos de Base de Datos

-- Eliminar duplicados existentes si los hay
DELETE FROM clubs
WHERE id IN (
  SELECT id
  FROM (
    SELECT id, name, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
    FROM clubs
  ) t
  WHERE rn > 1
);

-- Agregar restricción UNIQUE al nombre
ALTER TABLE clubs
ADD CONSTRAINT clubs_name_unique UNIQUE (name);

-- Comentario
COMMENT ON CONSTRAINT clubs_name_unique ON clubs IS 'Garantiza que el nombre de cada club sea único';
