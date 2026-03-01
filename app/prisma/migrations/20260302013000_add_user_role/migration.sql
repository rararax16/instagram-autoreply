ALTER TABLE `users`
  ADD COLUMN `role` ENUM('ADMIN', 'MEMBER') NOT NULL DEFAULT 'MEMBER' AFTER `password_hash`;

UPDATE `users`
SET `role` = 'ADMIN';
