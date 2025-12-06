-- Delete all data to avoid migration issues
DELETE FROM `UserGroup`;
DELETE FROM `GroupPermission`;
DELETE FROM `Group`;
DELETE FROM `ChannelConfiguration`;
DELETE FROM `Channel`;
DELETE FROM `RoleConfiguration`;
DELETE FROM `Role`;
DELETE FROM `TempVoiceAllowedUser`;
DELETE FROM `TempVoiceBlockedUser`;
DELETE FROM `TempVoiceChannel`;
DELETE FROM `Invitation`;
DELETE FROM `Sanction`;
DELETE FROM `SanctionReason`;
DELETE FROM `Configuration`;
DELETE FROM `CustomEmbed`;

-- DropIndex
DROP INDEX `SanctionReason_key_key` ON `SanctionReason`;

-- AlterTable
ALTER TABLE `Channel` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `Configuration` DROP PRIMARY KEY,
    ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default',
    ADD PRIMARY KEY (`guildId`, `key`);

-- AlterTable
ALTER TABLE `CustomEmbed` DROP PRIMARY KEY,
    ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default',
    ADD PRIMARY KEY (`guildId`, `name`);

-- AlterTable
ALTER TABLE `Group` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `Invitation` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `Role` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `Sanction` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `SanctionReason` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- AlterTable
ALTER TABLE `TempVoiceChannel` ADD COLUMN `guildId` VARCHAR(191) NOT NULL DEFAULT 'default';

-- CreateTable
CREATE TABLE `Guild` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;



-- CreateIndex
CREATE INDEX `Invitation_guildId_idx` ON `Invitation`(`guildId`);

-- CreateIndex
CREATE UNIQUE INDEX `SanctionReason_guildId_key_key` ON `SanctionReason`(`guildId`, `key`);

-- AddForeignKey
ALTER TABLE `Invitation` ADD CONSTRAINT `Invitation_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Channel` ADD CONSTRAINT `Channel_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Role` ADD CONSTRAINT `Role_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Group` ADD CONSTRAINT `Group_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Sanction` ADD CONSTRAINT `Sanction_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Configuration` ADD CONSTRAINT `Configuration_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TempVoiceChannel` ADD CONSTRAINT `TempVoiceChannel_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SanctionReason` ADD CONSTRAINT `SanctionReason_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomEmbed` ADD CONSTRAINT `CustomEmbed_guildId_fkey` FOREIGN KEY (`guildId`) REFERENCES `Guild`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
