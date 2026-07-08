UPDATE `itinerary_days`
SET `pinned_start_date` = NULL, `pinned_end_date` = NULL
WHERE `pinned_end_date` IS NOT NULL
	AND (`pinned_start_date` IS NULL OR `pinned_end_date` < `pinned_start_date`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_itinerary_days` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(256) NOT NULL,
	`trip_id` integer NOT NULL,
	`day_number` integer NOT NULL,
	`pinned_start_date` integer,
	`pinned_end_date` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "itinerary_days_day_number_check" CHECK("__new_itinerary_days"."day_number" >= 1),
	CONSTRAINT "itinerary_days_pinned_end_after_start" CHECK("__new_itinerary_days"."pinned_end_date" IS NULL OR "__new_itinerary_days"."pinned_start_date" IS NOT NULL),
	CONSTRAINT "itinerary_days_pinned_range_valid" CHECK("__new_itinerary_days"."pinned_end_date" IS NULL OR "__new_itinerary_days"."pinned_start_date" IS NULL OR "__new_itinerary_days"."pinned_end_date" >= "__new_itinerary_days"."pinned_start_date")
);
--> statement-breakpoint
INSERT INTO `__new_itinerary_days`("id", "name", "trip_id", "day_number", "pinned_start_date", "pinned_end_date", "created_at", "updated_at") SELECT "id", "name", "trip_id", "day_number", "pinned_start_date", "pinned_end_date", "created_at", "updated_at" FROM `itinerary_days`;--> statement-breakpoint
DROP TABLE `itinerary_days`;--> statement-breakpoint
ALTER TABLE `__new_itinerary_days` RENAME TO `itinerary_days`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `itinerary_days_trip_idx` ON `itinerary_days` (`trip_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `itinerary_days_trip_day_unique_idx` ON `itinerary_days` (`trip_id`,`day_number`);
