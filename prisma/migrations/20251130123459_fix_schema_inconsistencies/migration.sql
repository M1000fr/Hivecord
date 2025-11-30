/*
  Warnings:

  - The primary key for the `ChannelConfiguration` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the `UserConfiguration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `UserConfiguration` DROP FOREIGN KEY `UserConfiguration_userId_fkey`;

-- AlterTable
ALTER TABLE `ChannelConfiguration` DROP PRIMARY KEY,
    ADD PRIMARY KEY (`key`, `channelId`);

-- DropTable
DROP TABLE `UserConfiguration`;
