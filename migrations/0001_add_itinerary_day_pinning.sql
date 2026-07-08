ALTER TABLE `itinerary_days` ADD COLUMN `overnight_stop_id` integer REFERENCES `trip_overnight_stops`(`id`) ON DELETE set null;
--> statement-breakpoint
ALTER TABLE `itinerary_days` ADD COLUMN `pinned_start_date` integer;
--> statement-breakpoint
ALTER TABLE `itinerary_days` ADD COLUMN `pinned_end_date` integer;
--> statement-breakpoint
CREATE INDEX `itinerary_days_overnight_stop_idx` ON `itinerary_days` (`overnight_stop_id`);
