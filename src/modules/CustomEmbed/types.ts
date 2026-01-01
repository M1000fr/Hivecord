import type { APIEmbed } from "discord.js";

export interface EmbedEditorMeta {
	editingFieldIndex?: number;
}

export interface EmbedEditorSession {
	userId?: string;
	guildId: string;
	data: APIEmbed;
	name: string;
	meta?: EmbedEditorMeta;
}
