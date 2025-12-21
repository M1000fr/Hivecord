/*
  Warnings:

  - The primary key for the `ChannelConfiguration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `RoleConfiguration` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE `ChannelConfiguration` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`key`);

-- AlterTable
ALTER TABLE `RoleConfiguration` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`key`);

-- CreateTable
CREATE TABLE `ChannelListConfiguration` (
    `key` VARCHAR(191) NOT NULL,
    `channelId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`, `channelId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoleListConfiguration` (
    `key` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`key`, `roleId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ChannelListConfiguration` ADD CONSTRAINT `ChannelListConfiguration_channelId_fkey` FOREIGN KEY (`channelId`) REFERENCES `Channel`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoleListConfiguration` ADD CONSTRAINT `RoleListConfiguration_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
