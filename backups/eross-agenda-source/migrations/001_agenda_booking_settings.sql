-- EROSS Agenda: configuración de reservas por empresa.
-- Propuesta para revisar en rama de pruebas de Neon ANTES de aplicar.
-- No ejecutar directamente en producción sin revisión y respaldo.
CREATE TABLE IF NOT EXISTS agenda_booking_settings (
  company_id uuid PRIMARY KEY REFERENCES agenda_companies(id) ON DELETE CASCADE,
  slot_interval_min integer NOT NULL DEFAULT 30 CHECK (slot_interval_min IN (15,20,30,60)),
  min_notice_min integer NOT NULL DEFAULT 120 CHECK (min_notice_min IN (0,60,120,360,1440)),
  updated_at timestamptz NOT NULL DEFAULT now()
);
