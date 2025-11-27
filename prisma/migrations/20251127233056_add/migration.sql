/*
  Warnings:

  - Added the required column `moderatorId` to the `Sanction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Sanction` ADD COLUMN `moderatorId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `Sanction` ADD CONSTRAINT `Sanction_moderatorId_fkey` FOREIGN KEY (`moderatorId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
