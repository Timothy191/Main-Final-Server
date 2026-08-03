-- ============================================
-- Migration: 062_add_brakfontein_extension_sites
-- Description: Add 'Brakfontein' and 'Extension' as active mining sites.
-- ============================================

INSERT INTO sites (name, site_code, active) VALUES
  ('Brakfontein', 'BRAK', true),
  ('Extension', 'EXT', true)
ON CONFLICT (site_code) DO NOTHING;
