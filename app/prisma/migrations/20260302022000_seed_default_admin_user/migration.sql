SET @admin_email = _utf8mb4'karakawa.takuya@progood.jp' COLLATE utf8mb4_unicode_ci;
SET @admin_password_hash = 'b05bd6326c5c0dab601b7e2e5c3f56aa:b89c4f15e63cb0c547e805db4ba0002ff43111a8386a100faef3f59cb8bad9afa0270d50f630c22cdee1f0b040840e98495b2cd22dc108afa7eebc99f09a8fe3';
SET @admin_tenant_id = REPLACE(UUID(), '-', '');
SET @admin_user_id = REPLACE(UUID(), '-', '');

INSERT INTO `tenants` (`id`, `name`, `created_at`, `updated_at`)
SELECT @admin_tenant_id, '初期管理者テナント', NOW(3), NOW(3)
WHERE NOT EXISTS (
  SELECT 1
  FROM `users`
  WHERE `email` COLLATE utf8mb4_unicode_ci = @admin_email
);

INSERT INTO `users` (`id`, `tenant_id`, `email`, `password_hash`, `role`, `created_at`, `updated_at`)
SELECT @admin_user_id, @admin_tenant_id, @admin_email, @admin_password_hash, 'ADMIN', NOW(3), NOW(3)
WHERE NOT EXISTS (
  SELECT 1
  FROM `users`
  WHERE `email` COLLATE utf8mb4_unicode_ci = @admin_email
);
