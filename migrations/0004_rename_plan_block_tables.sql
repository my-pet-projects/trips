PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `plan_blocks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`trip_id` integer NOT NULL,
	`block_number` integer NOT NULL,
	`pinned_start_date` integer,
	`pinned_end_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "plan_blocks_block_number_check" CHECK("plan_blocks"."block_number" >= 1),
	CONSTRAINT "plan_blocks_pinned_end_after_start" CHECK("plan_blocks"."pinned_end_date" IS NULL OR "plan_blocks"."pinned_start_date" IS NOT NULL),
	CONSTRAINT "plan_blocks_pinned_range_valid" CHECK("plan_blocks"."pinned_end_date" IS NULL OR "plan_blocks"."pinned_start_date" IS NULL OR "plan_blocks"."pinned_end_date" >= "plan_blocks"."pinned_start_date")
);
--> statement-breakpoint
INSERT INTO `plan_blocks`("id", "name", "trip_id", "block_number", "pinned_start_date", "pinned_end_date", "created_at", "updated_at") SELECT "id", "name", "trip_id", "day_number", "pinned_start_date", "pinned_end_date", "created_at", "updated_at" FROM `itinerary_days`;--> statement-breakpoint
DROP TABLE `itinerary_days`;--> statement-breakpoint
CREATE TABLE `plan_block_places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_block_id` integer NOT NULL,
	`attraction_id` integer NOT NULL,
	`order` integer NOT NULL,
	FOREIGN KEY (`plan_block_id`) REFERENCES `plan_blocks`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`attraction_id`) REFERENCES `attractions`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "plan_block_places_order_check" CHECK("plan_block_places"."order" >= 1)
);
--> statement-breakpoint
INSERT INTO `plan_block_places`("id", "plan_block_id", "attraction_id", "order") SELECT "id", "itinerary_day_id", "attraction_id", "order" FROM `itinerary_day_places`;--> statement-breakpoint
DROP TABLE `itinerary_day_places`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `plan_blocks_trip_idx` ON `plan_blocks` (`trip_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `plan_blocks_trip_block_unique_idx` ON `plan_blocks` (`trip_id`,`block_number`);--> statement-breakpoint
CREATE INDEX `plan_block_places_block_idx` ON `plan_block_places` (`plan_block_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `plan_block_places_unique_idx` ON `plan_block_places` (`plan_block_id`,`attraction_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `plan_block_places_order_unique_idx` ON `plan_block_places` (`plan_block_id`,`order`);
