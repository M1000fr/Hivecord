-- AlterTable
ALTER TABLE `Configuration` ADD COLUMN `channelId` VARCHAR(191) NULL,
    MODIFY `value` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Configuration` ADD CONSTRAINT `Configuration_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
