-- DropForeignKey
ALTER TABLE `GroupPermission` DROP FOREIGN KEY `GroupPermission_groupId_fkey`;

-- DropForeignKey
ALTER TABLE `UserGroup` DROP FOREIGN KEY `UserGroup_groupId_fkey`;

-- DropIndex
DROP INDEX `GroupPermission_groupId_fkey` ON `GroupPermission`;

-- DropIndex
DROP INDEX `UserGroup_groupId_fkey` ON `UserGroup`;

-- AddForeignKey
ALTER TABLE `UserGroup` ADD CONSTRAINT `UserGroup_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GroupPermission` ADD CONSTRAINT `GroupPermission_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `Group`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
