CREATE TABLE `guide_budget_totals` (
	`scope` text PRIMARY KEY NOT NULL,
	`reserved_microusd` integer NOT NULL,
	`request_count` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guide_requests` (
	`request_id` text PRIMARY KEY NOT NULL,
	`viewer_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`reserved_microusd` integer NOT NULL,
	`status` text NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer,
	`output_tokens` integer,
	`error_code` text
);
--> statement-breakpoint
CREATE INDEX `idx_guide_requests_viewer_created` ON `guide_requests` (`viewer_hash`,`created_at`);
--> statement-breakpoint
CREATE INDEX `idx_guide_requests_created` ON `guide_requests` (`created_at`);
--> statement-breakpoint
CREATE TRIGGER `guide_requests_budget_insert`
AFTER INSERT ON `guide_requests`
BEGIN
	INSERT INTO `guide_budget_totals` (`scope`, `reserved_microusd`, `request_count`, `updated_at`)
	VALUES ('lifetime', NEW.`reserved_microusd`, 1, NEW.`created_at`)
	ON CONFLICT(`scope`) DO UPDATE SET
		`reserved_microusd` = `reserved_microusd` + NEW.`reserved_microusd`,
		`request_count` = `request_count` + 1,
		`updated_at` = NEW.`created_at`;
END;
