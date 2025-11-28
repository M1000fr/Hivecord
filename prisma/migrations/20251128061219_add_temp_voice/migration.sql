-- CreateTable
CREATE TABLE `TempVoiceChannel` (
    `id` VARCHAR(191) NOT NULL,
    `ownerId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `isLocked` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TempVoiceAllowedUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tempVoiceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TempVoiceBlockedUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tempVoiceId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TempVoiceChannel` ADD CONSTRAINT `TempVoiceChannel_ownerId_fkey` FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TempVoiceAllowedUser` ADD CONSTRAINT `TempVoiceAllowedUser_tempVoiceId_fkey` FOREIGN KEY (`tempVoiceId`) REFERENCES `TempVoiceChannel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TempVoiceAllowedUser` ADD CONSTRAINT `TempVoiceAllowedUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TempVoiceBlockedUser` ADD CONSTRAINT `TempVoiceBlockedUser_tempVoiceId_fkey` FOREIGN KEY (`tempVoiceId`) REFERENCES `TempVoiceChannel`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TempVoiceBlockedUser` ADD CONSTRAINT `TempVoiceBlockedUser_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
