-- Agregar columnas faltantes a la tabla permanent_bans
-- Ejecutar este script en la base de datos local para corregir los errores de TypeScript

-- Agregar columna worldid_nullifier_hash si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='permanent_bans' 
        AND column_name='worldid_nullifier_hash'
    ) THEN
        ALTER TABLE permanent_bans 
        ADD COLUMN worldid_nullifier_hash TEXT;
        RAISE NOTICE 'Columna worldid_nullifier_hash agregada a permanent_bans';
    ELSE
        RAISE NOTICE 'Columna worldid_nullifier_hash ya existe en permanent_bans';
    END IF;
END $$;

-- Agregar columna fingerprint_ids si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='permanent_bans' 
        AND column_name='fingerprint_ids'
    ) THEN
        ALTER TABLE permanent_bans 
        ADD COLUMN fingerprint_ids TEXT[];
        RAISE NOTICE 'Columna fingerprint_ids agregada a permanent_bans';
    ELSE
        RAISE NOTICE 'Columna fingerprint_ids ya existe en permanent_bans';
    END IF;
END $$;
