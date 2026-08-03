-- ============================================
-- Additional Constraints: JSONB Validation
-- ============================================

-- Ensure report_data is a JSON object
ALTER TABLE generated_reports 
  ADD CONSTRAINT report_data_is_object 
  CHECK (jsonb_typeof(report_data) = 'object');

-- Ensure metadata in memory_embeddings is a JSON object
ALTER TABLE memory_embeddings 
  ADD CONSTRAINT memory_metadata_is_object 
  CHECK (jsonb_typeof(metadata) = 'object');

-- Ensure config in report_templates is a JSON object
ALTER TABLE report_templates 
  ADD CONSTRAINT report_config_is_object 
  CHECK (jsonb_typeof(config) = 'object');
