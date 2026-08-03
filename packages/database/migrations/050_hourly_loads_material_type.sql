-- Migration to add material_type to hourly_loads table
ALTER TABLE hourly_loads 
ADD COLUMN IF NOT EXISTS material_type TEXT NOT NULL DEFAULT 'Waste' 
CHECK (material_type IN ('Waste', 'Coal'));

COMMENT ON COLUMN hourly_loads.material_type IS 'Type of material: Waste or Coal';
