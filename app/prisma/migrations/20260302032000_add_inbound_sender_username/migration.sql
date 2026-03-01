ALTER TABLE `inbound_events`
  ADD COLUMN `sender_username` VARCHAR(191) NULL AFTER `sender_id`;
