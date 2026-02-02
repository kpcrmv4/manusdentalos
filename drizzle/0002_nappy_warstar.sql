CREATE TABLE `pushSubscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`endpoint` text NOT NULL,
	`p256dh` text NOT NULL,
	`auth` text NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pushSubscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surgeryCaseMaterials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseId` int NOT NULL,
	`productId` int NOT NULL,
	`requiredQty` decimal(10,2) NOT NULL,
	`reservedQty` decimal(10,2) NOT NULL DEFAULT '0',
	`usedQty` decimal(10,2) NOT NULL DEFAULT '0',
	`status` enum('pending','reserved','used') NOT NULL DEFAULT 'pending',
	`reservationId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surgeryCaseMaterials_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `surgeryCases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(100) NOT NULL,
	`patientName` varchar(255) NOT NULL,
	`patientId` varchar(100),
	`surgeryDate` timestamp NOT NULL,
	`surgeryType` varchar(255),
	`dentistName` varchar(255),
	`status` enum('planned','materials_ready','materials_partial','in_progress','completed','cancelled') NOT NULL DEFAULT 'planned',
	`materialStatus` enum('green','yellow','red') NOT NULL DEFAULT 'red',
	`notes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `surgeryCases_id` PRIMARY KEY(`id`),
	CONSTRAINT `surgeryCases_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
ALTER TABLE `pushSubscriptions` ADD CONSTRAINT `pushSubscriptions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surgeryCaseMaterials` ADD CONSTRAINT `surgeryCaseMaterials_caseId_surgeryCases_id_fk` FOREIGN KEY (`caseId`) REFERENCES `surgeryCases`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surgeryCaseMaterials` ADD CONSTRAINT `surgeryCaseMaterials_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surgeryCaseMaterials` ADD CONSTRAINT `surgeryCaseMaterials_reservationId_reservations_id_fk` FOREIGN KEY (`reservationId`) REFERENCES `reservations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `surgeryCases` ADD CONSTRAINT `surgeryCases_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `userId_idx` ON `pushSubscriptions` (`userId`);--> statement-breakpoint
CREATE INDEX `caseNumber_idx` ON `surgeryCases` (`caseNumber`);--> statement-breakpoint
CREATE INDEX `surgeryDate_idx` ON `surgeryCases` (`surgeryDate`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `surgeryCases` (`status`);