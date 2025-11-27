import { ChatInputCommandInteraction, Client, Role } from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { DefaultCommand } from "../../decorators/DefaultCommand";
import { EPermission } from "../../enums/EPermission";
import { replaceRoleOptions } from "./replaceRoleOptions";
import { prismaClient } from "../../services/prismaService";

@Command(replaceRoleOptions)
export default class ReplaceRoleCommand extends BaseCommand {
    @DefaultCommand(EPermission.CommandsReplaceRole)
    async run(client: Client, interaction: ChatInputCommandInteraction) {
        const oldRoleId = interaction.options.getString("old-role-id", true);
        const newRole = interaction.options.getRole("new-role", true) as Role;

        await interaction.deferReply();

        try {
            // Ensure new role exists in DB
            await prismaClient.role.upsert({
                where: { id: newRole.id },
                create: { id: newRole.id },
                update: { deletedAt: null },
            });

            // Update Groups
            const updateResult = await prismaClient.group.updateMany({
                where: {
                    roleId: oldRoleId,
                },
                data: {
                    roleId: newRole.id,
                },
            });

            await interaction.editReply(`Successfully updated ${updateResult.count} groups from role ID \`${oldRoleId}\` to role ${newRole}.`);

        } catch (error) {
            console.error(error);
            await interaction.editReply("An error occurred while replacing the role.");
        }
    }
}
