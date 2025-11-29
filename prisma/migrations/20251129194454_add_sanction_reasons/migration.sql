-- CreateTable
CREATE TABLE `SanctionReason` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NULL,
    `text` VARCHAR(191) NOT NULL,
    `type` ENUM('WARN', 'MUTE', 'KICK', 'BAN') NOT NULL,
    `duration` VARCHAR(191) NULL,
    `isSystem` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `SanctionReason_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
