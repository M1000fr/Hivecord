-- AlterTable
ALTER TABLE `Role` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `leftAt` DATETIME(3) NULL;
