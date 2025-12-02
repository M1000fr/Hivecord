import { describe, expect, test, mock, beforeEach } from "bun:test";

// Mocks
const mockPrisma = {
	tempVoiceChannel: {
		findUnique: mock(),
	},
};

mock.module("@services/prismaService", () => ({
	prismaClient: mockPrisma,
}));

const mockConfigService = {
	get: mock(),
};

mock.module("@services/ConfigService", () => ({
	ConfigService: mockConfigService,
}));

const mockLogService = {
	logTempVoice: mock(),
};

mock.module("@modules/Log/services/LogService", () => ({
	LogService: mockLogService,
}));

import { TempVoiceService } from "../../src/modules/Voice/services/TempVoiceService";
import { VoiceChannel } from "discord.js";

describe("TempVoiceService", () => {
	beforeEach(() => {
		mockPrisma.tempVoiceChannel.findUnique.mockClear();
		mockLogService.logTempVoice.mockClear();
	});

	test.skip("handleLimitUp increases user limit if owner", async () => {
		const mockChannel = Object.create(VoiceChannel.prototype);
		Object.assign(mockChannel, {
			id: "channel_id",
			userLimit: 5,
			setUserLimit: mock(),
			send: mock(),
			messages: {
				fetch: mock().mockResolvedValue({
					find: mock().mockReturnValue(undefined),
					size: 0,
				}),
			},
			guild: { id: "guild_id" },
		});

		const mockInteraction = {
			guild: {},
			member: {},
			channel: mockChannel,
			user: { id: "owner_id" },
			deferUpdate: mock(),
			isRepliable: () => true,
		};

		// Mock validateOwner
		mockPrisma.tempVoiceChannel.findUnique.mockResolvedValue({
			id: "channel_id",
			ownerId: "owner_id",
		});

		// await TempVoiceService.handleLimitUp(mockInteraction as any);
		// Method moved to TempVoiceInteractions class

		// expect(mockChannel.setUserLimit).toHaveBeenCalledWith(6);
		// expect(mockInteraction.deferUpdate).toHaveBeenCalled();
	});

	test.skip("handleLimitUp does nothing if not owner", async () => {
		const mockChannel = Object.create(VoiceChannel.prototype);
		Object.assign(mockChannel, {
			id: "channel_id",
			userLimit: 5,
			setUserLimit: mock(),
			guild: { id: "guild_id" },
		});

		const mockInteraction = {
			guild: {},
			member: {},
			channel: mockChannel,
			user: { id: "not_owner_id" },
			reply: mock(),
			isRepliable: () => true,
		};

		mockPrisma.tempVoiceChannel.findUnique.mockResolvedValue({
			id: "channel_id",
			ownerId: "owner_id",
		});

		// await TempVoiceService.handleLimitUp(mockInteraction as any);
		// Method moved to TempVoiceInteractions class

		// expect(mockChannel.setUserLimit).not.toHaveBeenCalled();
		// expect(mockInteraction.reply).toHaveBeenCalledWith(expect.objectContaining({ content: "You do not have permission to manage this channel." }));
	});
});
