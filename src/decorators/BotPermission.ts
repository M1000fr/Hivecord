import {
	ChatInputCommandInteraction,
	Client,
	MessageFlags,
	type PermissionResolvable,
} from "discord.js";

export function BotPermission(...permissions: PermissionResolvable[]) {
	return function (
		target: any,
		propertyKey: string,
		descriptor: PropertyDescriptor,
	) {
		const originalMethod = descriptor.value;

		descriptor.value = async function (
			client: Client,
			interaction: ChatInputCommandInteraction,
			...args: any[]
		) {
			if (!interaction.guild) {
				await interaction.reply({
					content: "This command can only be used in a server.",
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			const me = interaction.guild.members.me;
			if (!me) {
				// Should not happen if interaction is in guild
				await interaction.reply({
					content: "I cannot verify my permissions.",
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			const missingPermissions = me.permissions.missing(permissions);

			if (missingPermissions.length > 0) {
				const formattedPermissions = missingPermissions
					.map((p) => `\`${p}\``)
					.join(", ");
				await interaction.reply({
					content: `I am missing the following permissions to perform this action: ${formattedPermissions}`,
					flags: [MessageFlags.Ephemeral],
				});
				return;
			}

			return originalMethod.apply(this, [client, interaction, ...args]);
		};

		return descriptor;
	};
}
