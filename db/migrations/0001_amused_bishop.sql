CREATE TABLE `testimonials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`display_name` varchar(80) NOT NULL,
	`content` text NOT NULL,
	`source` enum('boutique','whatsapp') NOT NULL,
	`date_label` varchar(40),
	`status` enum('draft','pending','published','archived') NOT NULL DEFAULT 'draft',
	`publication_consent` boolean NOT NULL DEFAULT false,
	`consent_confirmed_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `testimonials_id` PRIMARY KEY(`id`)
);
