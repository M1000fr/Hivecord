export interface TimeRange {
	start: Date;
	end: Date;
}

export interface UserVoiceStats {
	userId: string;
	totalDuration: number; // seconds
	channelBreakdown: { channelId: string; duration: number }[];
	timeSeries: { timestamp: number; value: number }[];
}

export interface UserMessageStats {
	userId: string;
	totalMessages: number;
	channelBreakdown: { channelId: string; count: number }[];
	timeSeries: { timestamp: number; value: number }[];
}

export interface ChannelStats {
	channelId: string;
	messageCount: number;
	voiceDuration: number; // seconds
	uniqueUsers: number;
}

export interface ServerStats {
	guildId: string;
	totalMessages: number;
	totalVoiceDuration: number;
	activeUsers: number;
	joinCount: number;
	leaveCount: number;
}
