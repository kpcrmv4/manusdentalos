CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tableName` varchar(100) NOT NULL,
	`recordId` int NOT NULL,
	`action` enum('create','update','delete') NOT NULL,
	`oldValues` text,
	`newValues` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventoryLots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` int NOT NULL,
	`lotNumber` varchar(100) NOT NULL,
	`expiryDate` timestamp,
	`physicalQty` decimal(10,2) NOT NULL DEFAULT '0',
	`availableQty` decimal(10,2) NOT NULL DEFAULT '0',
	`reservedQty` decimal(10,2) NOT NULL DEFAULT '0',
	`costPrice` decimal(10,2),
	`supplierId` int,
	`invoiceNo` varchar(100),
	`refCode` varchar(100),
	`receivedDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `inventoryLots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('low_stock','expiring_soon','expired','pending_order','slow_moving') NOT NULL,
	`title` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`relatedTable` varchar(100),
	`relatedId` int,
	`isRead` boolean NOT NULL DEFAULT false,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productCode` varchar(100) NOT NULL,
	`name` varchar(500) NOT NULL,
	`refCode` varchar(100),
	`brand` varchar(255),
	`model` varchar(255),
	`size` varchar(100),
	`categoryId` int,
	`unit` varchar(50) NOT NULL DEFAULT 'ชิ้น',
	`minStockLevel` int DEFAULT 0,
	`description` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`createdBy` int,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productCode_unique` UNIQUE(`productCode`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrderItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poId` int NOT NULL,
	`productId` int NOT NULL,
	`orderedQty` decimal(10,2) NOT NULL,
	`receivedQty` decimal(10,2) NOT NULL DEFAULT '0',
	`unitPrice` decimal(10,2),
	`totalPrice` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrderItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchaseOrders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`poNumber` varchar(100) NOT NULL,
	`supplierId` int NOT NULL,
	`orderDate` timestamp NOT NULL DEFAULT (now()),
	`expectedDeliveryDate` timestamp,
	`status` enum('pending','partially_received','completed','cancelled') NOT NULL DEFAULT 'pending',
	`totalAmount` decimal(12,2),
	`notes` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchaseOrders_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchaseOrders_poNumber_unique` UNIQUE(`poNumber`)
);
--> statement-breakpoint
CREATE TABLE `reservations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lotId` int NOT NULL,
	`reservedQty` decimal(10,2) NOT NULL,
	`status` enum('active','committed','cancelled') NOT NULL DEFAULT 'active',
	`reservedBy` int NOT NULL,
	`reservedFor` varchar(500),
	`patientName` varchar(255),
	`surgeryDate` timestamp,
	`expiresAt` timestamp,
	`committedAt` timestamp,
	`cancelledAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reservations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(100) NOT NULL,
	`name` varchar(500) NOT NULL,
	`contactPerson` varchar(255),
	`phone` varchar(50),
	`email` varchar(320),
	`address` text,
	`leadTimeDays` int DEFAULT 7,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `usageLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`lotId` int NOT NULL,
	`reservationId` int,
	`usedQty` decimal(10,2) NOT NULL,
	`patientName` varchar(255),
	`surgeryDate` timestamp,
	`photoEvidence` text,
	`notes` text,
	`loggedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `usageLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `auditLogs` ADD CONSTRAINT `auditLogs_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryLots` ADD CONSTRAINT `inventoryLots_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `inventoryLots` ADD CONSTRAINT `inventoryLots_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_categoryId_categories_id_fk` FOREIGN KEY (`categoryId`) REFERENCES `categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseOrderItems` ADD CONSTRAINT `purchaseOrderItems_poId_purchaseOrders_id_fk` FOREIGN KEY (`poId`) REFERENCES `purchaseOrders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseOrderItems` ADD CONSTRAINT `purchaseOrderItems_productId_products_id_fk` FOREIGN KEY (`productId`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD CONSTRAINT `purchaseOrders_supplierId_suppliers_id_fk` FOREIGN KEY (`supplierId`) REFERENCES `suppliers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `purchaseOrders` ADD CONSTRAINT `purchaseOrders_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_lotId_inventoryLots_id_fk` FOREIGN KEY (`lotId`) REFERENCES `inventoryLots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `reservations` ADD CONSTRAINT `reservations_reservedBy_users_id_fk` FOREIGN KEY (`reservedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usageLogs` ADD CONSTRAINT `usageLogs_lotId_inventoryLots_id_fk` FOREIGN KEY (`lotId`) REFERENCES `inventoryLots`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usageLogs` ADD CONSTRAINT `usageLogs_reservationId_reservations_id_fk` FOREIGN KEY (`reservationId`) REFERENCES `reservations`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `usageLogs` ADD CONSTRAINT `usageLogs_loggedBy_users_id_fk` FOREIGN KEY (`loggedBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `tableName_idx` ON `auditLogs` (`tableName`);--> statement-breakpoint
CREATE INDEX `recordId_idx` ON `auditLogs` (`recordId`);--> statement-breakpoint
CREATE INDEX `createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `productId_idx` ON `inventoryLots` (`productId`);--> statement-breakpoint
CREATE INDEX `lotNumber_idx` ON `inventoryLots` (`lotNumber`);--> statement-breakpoint
CREATE INDEX `expiryDate_idx` ON `inventoryLots` (`expiryDate`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `notifications` (`type`);--> statement-breakpoint
CREATE INDEX `isRead_idx` ON `notifications` (`isRead`);--> statement-breakpoint
CREATE INDEX `userId_idx` ON `notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `productCode_idx` ON `products` (`productCode`);--> statement-breakpoint
CREATE INDEX `refCode_idx` ON `products` (`refCode`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `products` (`name`);--> statement-breakpoint
CREATE INDEX `poNumber_idx` ON `purchaseOrders` (`poNumber`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `purchaseOrders` (`status`);--> statement-breakpoint
CREATE INDEX `lotId_idx` ON `reservations` (`lotId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `reservations` (`status`);--> statement-breakpoint
CREATE INDEX `surgeryDate_idx` ON `reservations` (`surgeryDate`);--> statement-breakpoint
CREATE INDEX `lotId_idx` ON `usageLogs` (`lotId`);--> statement-breakpoint
CREATE INDEX `surgeryDate_idx` ON `usageLogs` (`surgeryDate`);