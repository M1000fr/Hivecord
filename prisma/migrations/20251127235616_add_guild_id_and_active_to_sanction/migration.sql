/*
  Warnings:

  - Added the required column `guildId` to the `Sanction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Sanction` ADD COLUMN `active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `guildId` VARCHAR(191) NOT NULL;
