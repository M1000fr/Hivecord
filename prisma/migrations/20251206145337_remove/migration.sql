-- AlterTable
ALTER TABLE `Channel` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Configuration` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `CustomEmbed` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Group` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Invitation` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Role` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `Sanction` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `SanctionReason` ALTER COLUMN `guildId` DROP DEFAULT;

-- AlterTable
ALTER TABLE `TempVoiceChannel` ALTER COLUMN `guildId` DROP DEFAULT;
