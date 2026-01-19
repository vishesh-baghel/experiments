CREATE TABLE `document_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`document_id` text NOT NULL,
	`version` integer NOT NULL,
	`content` text NOT NULL,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_versions_document` ON `document_versions` (`document_id`,`version`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`path` text NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`tags` text,
	`metadata` text,
	`source` text,
	`type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` integer,
	`last_write_source` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_path_unique` ON `documents` (`path`);--> statement-breakpoint
CREATE INDEX `idx_documents_path` ON `documents` (`path`);--> statement-breakpoint
CREATE INDEX `idx_documents_deleted` ON `documents` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `idx_documents_updated` ON `documents` (`updated_at`);