import { ChatInputCommandInteraction, Client, EmbedBuilder, Colors } from "discord.js";
import { BaseCommand } from '@class/BaseCommand';
import { Command } from '@decorators/Command';
import { Subcommand } from '@decorators/Subcommand';
import { EPermission } from '@enums/EPermission';
import { groupOptions } from "./groupOptions";
import { GroupService } from '@services/GroupService';
import { InteractionHelper } from '@utils/InteractionHelper';
import { Pager } from '@class/Pager';

@Command(groupOptions)
export default class GroupCommand extends BaseCommand {
    private async sendGroupEmbed(interaction: ChatInputCommandInteraction, groupName: string, title: string) {
        const group = await GroupService.getGroup(groupName);
        if (!group) return;

        const perms = group.Permissions.map(p => `\`${p.Permissions.name}\``).join(", ") || "None";

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`**Group:** ${group.name}\n**Role:** <@&${group.roleId}>\n**Permissions:**\n${perms}`)
            .setColor(Colors.Blue)
            .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
    }

    @Subcommand({ name: "create", permission: EPermission.GroupsCreate })
    async create(client: Client, interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString("name", true);
        const role = interaction.options.getRole("role", true);

        await InteractionHelper.defer(interaction, true);

        try {
            await GroupService.createGroup(name, role.id);
            await this.sendGroupEmbed(interaction, name, "Group Created");
        } catch (error: any) {
            await InteractionHelper.respondError(interaction, `Failed to create group: ${error.message}`);
        }
    }

    @Subcommand({ name: "delete", permission: EPermission.GroupsDelete })
    async delete(client: Client, interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString("name", true);

        await InteractionHelper.defer(interaction, true);

        try {
            await GroupService.deleteGroup(name);
            await interaction.editReply(`Group \`${name}\` deleted.`);
        } catch (error: any) {
            await InteractionHelper.respondError(interaction, `Failed to delete group: ${error.message}`);
        }
    }

    @Subcommand({ name: "add", group: "permissions", permission: EPermission.GroupsUpdate })
    async addPerm(client: Client, interaction: ChatInputCommandInteraction) {
        const groupName = interaction.options.getString("group", true);
        const permission = interaction.options.getString("permission", true);

        await InteractionHelper.defer(interaction, true);

        try {
            await GroupService.addPermission(groupName, permission);
            await this.sendGroupEmbed(interaction, groupName, "Permission Added");
        } catch (error: any) {
            await InteractionHelper.respondError(interaction, `Failed to add permission: ${error.message}`);
        }
    }

    @Subcommand({ name: "remove", group: "permissions", permission: EPermission.GroupsUpdate })
    async removePerm(client: Client, interaction: ChatInputCommandInteraction) {
        const groupName = interaction.options.getString("group", true);
        const permission = interaction.options.getString("permission", true);

        await InteractionHelper.defer(interaction, true);

        try {
            await GroupService.removePermission(groupName, permission);
            await this.sendGroupEmbed(interaction, groupName, "Permission Removed");
        } catch (error: any) {
            await InteractionHelper.respondError(interaction, `Failed to remove permission: ${error.message}`);
        }
    }

    @Subcommand({ name: "list", permission: EPermission.GroupsList })
    async list(client: Client, interaction: ChatInputCommandInteraction) {
        await InteractionHelper.defer(interaction, false);

        try {
            const groups = await GroupService.listGroups();
            if (groups.length === 0) {
                await interaction.editReply("No groups found.");
                return;
            }

            const pager = new Pager({
                items: groups,
                itemsPerPage: 1,
                renderPage: async (items, pageIndex, totalPages) => {
                    const group = items[0];
                    if (!group) return { embeds: [], components: [] };

                    const perms = group.Permissions.map(p => `\`${p.Permissions.name}\``).join(", ") || "None";
                    
                    const embed = new EmbedBuilder()
                        .setTitle(`Group List (${pageIndex + 1}/${totalPages})`)
                        .setDescription(`**Group:** ${group.name}\n**Role:** <@&${group.roleId}>\n**Permissions:**\n${perms}`)
                        .setColor(Colors.Blue)
                        .setTimestamp();
                    
                    return { embeds: [embed], components: [] };
                }
            });

            await pager.start(interaction);
        } catch (error: any) {
            await InteractionHelper.respondError(interaction, `Failed to list groups: ${error.message}`);
        }
    }
}
