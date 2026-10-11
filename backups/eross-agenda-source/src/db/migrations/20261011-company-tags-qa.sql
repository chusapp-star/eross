-- Additive QA-only catalog. Existing appointments/tags and settings remain unchanged.
CREATE TABLE IF NOT EXISTS agenda_company_tags_qa (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES agenda_companies(id) ON DELETE RESTRICT,
 label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 48 AND position(',' in label)=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(company_id,label)
);
