DROP INDEX `routes_unique_idx`;--> statement-breakpoint
ALTER TABLE `routes` ADD `travel_mode` text DEFAULT 'walking' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `routes_unique_idx` ON `routes` (`from_attraction_id`,`to_attraction_id`,`travel_mode`);