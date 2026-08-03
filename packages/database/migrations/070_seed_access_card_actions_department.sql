-- Seed access-card-actions department (hub panel + proxy ACL)
INSERT INTO departments (name, display_name, icon, description, color) VALUES
  (
    'access-card-actions',
    'Access Card Actions',
    'CreditCard',
    'Manage printed badges, print cards & QR generation',
    'blue'
  )
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  color = EXCLUDED.color;
