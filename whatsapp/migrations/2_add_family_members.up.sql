-- family_members: Información detallada de miembros de la familia
-- (no necesitan tener WhatsApp, por ejemplo: niños)
CREATE TABLE family_members (
  id BIGSERIAL PRIMARY KEY,
  household_id BIGINT REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  age INT,
  relationship VARCHAR(50), -- 'padre', 'madre', 'hijo', 'hija', 'otro'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_family_members_household ON family_members(household_id);

