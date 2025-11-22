-- Consolidar household_members y family_members en una sola tabla
-- Ahora household_members puede tener o no phone_number

-- Primero, agregar las columnas que necesitamos de family_members
ALTER TABLE household_members
  ADD COLUMN IF NOT EXISTS name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS age INT,
  ADD COLUMN IF NOT EXISTS relationship VARCHAR(50),
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- Hacer phone_number nullable (porque no todos tienen WhatsApp)
ALTER TABLE household_members
  ALTER COLUMN phone_number DROP NOT NULL;

-- Cambiar la constraint unique para permitir multiple miembros sin phone
-- Primero eliminar el constraint, luego el índice
ALTER TABLE household_members
  DROP CONSTRAINT IF EXISTS household_members_household_id_phone_number_key;

-- Nueva constraint: solo un miembro por phone_number por household (si tiene phone)
CREATE UNIQUE INDEX household_members_unique_phone 
  ON household_members(household_id, phone_number) 
  WHERE phone_number IS NOT NULL;

-- Migrar datos de family_members si existen
INSERT INTO household_members (household_id, name, age, relationship, notes, role)
SELECT household_id, name, age, relationship, notes, 'member'
FROM family_members
ON CONFLICT DO NOTHING;

-- Eliminar la tabla family_members (ya no la necesitamos)
DROP TABLE IF EXISTS family_members;

-- Asegurar que siempre tengamos al menos name o phone_number
ALTER TABLE household_members
  ADD CONSTRAINT household_members_name_or_phone_check 
  CHECK (name IS NOT NULL OR phone_number IS NOT NULL);

