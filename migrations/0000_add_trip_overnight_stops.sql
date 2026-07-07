CREATE TABLE `trip_overnight_stops` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`trip_id` integer NOT NULL,
	`name` text(256) NOT NULL,
	`address` text NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`check_in_date` integer NOT NULL,
	`check_out_date` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer,
	FOREIGN KEY (`trip_id`) REFERENCES `trips`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "trip_overnight_stops_check_out_after_check_in" CHECK("trip_overnight_stops"."check_out_date" > "trip_overnight_stops"."check_in_date")
);
--> statement-breakpoint
CREATE INDEX `trip_overnight_stops_trip_idx` ON `trip_overnight_stops` (`trip_id`);
--> statement-breakpoint
CREATE INDEX `trip_overnight_stops_check_in_idx` ON `trip_overnight_stops` (`trip_id`,`check_in_date`);
