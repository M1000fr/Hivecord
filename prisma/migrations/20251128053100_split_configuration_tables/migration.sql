/*
  Warnings:

  - You are about to drop the column `channelId` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `Configuration` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Configuration` table. All the data in the column will be lost.
  - Made the column `value` on table `Configuration` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `Configuration` DROP FOREIGN KEY `Configuration_channelId_fkey`;

-- DropForeignKey
ALTER TABLE `Configuration` DROP FOREIGN KEY `Configuration_roleId_fkey`;

-- DropForeignKey
ALTER TABLE `Configuration` DROP FOREIGN KEY `Configuration_userId_fkey`;

-- DropIndex
DROP INDEX `Configuration_channelId_fkey` ON `Configuration`;

-- DropIndex
DROP INDEX `Configuration_roleId_fkey` ON `Configuration`;

-- DropIndex
DROP INDEX `Configuration_userId_fkey` ON `Configuration`;

-- AlterTable
ALTER TABLE `Configuration` DROP COLUMN `channelId`,
    DROP COLUMN `roleId`,
    DROP COLUMN `userId`,
    MODIFY `value` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `ChannelConfiguration` (
    `key` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleConfiguration` (
    `key` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserConfiguration` (
    `key` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChannelConfiguration` ADD CONSTRAINT `ChannelConfiguration_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleConfiguration` ADD CONSTRAINT `RoleConfiguration_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserConfiguration` ADD CONSTRAINT `UserConfiguration_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
