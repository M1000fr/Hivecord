import { ChatInputCommandInteraction, Client, MessageFlags } from "discord.js";
import { BaseCommand } from "../../class/BaseCommand";
import { Command } from "../../decorators/Command";
import { Subcommand } from "../../decorators/Subcommand";
import { EPermission } from "../../enums/EPermission";
import { prismaClient } from "../../services/prismaService";
import { groupOptions } from "./groupOptions";

@Command(groupOptions)
export default class GroupCommand extends BaseCommand {
    
    @Subcommand({ name: "list", permission: EPermission.GroupsList })
    private async listGroups(client: Client, interaction: ChatInputCommandInteraction) {
        const groups = await prismaClient.group.findMany({
            include: {
                Role: true
            }
        });

        if (groups.length === 0) {
            await interaction.reply({ content: "No groups found.", flags: [MessageFlags.Ephemeral]  });
            return;
        }

        const groupList = groups.map(g => `**ID:** ${g.id} | **Name:** ${g.name} | **Role:** <@&${g.roleId}>`).join("\n");
        await interaction.reply({ content: `**Groups List:**\n${groupList}`, flags: [MessageFlags.Ephemeral]  });
    }

    @Subcommand({ name: "create", permission: EPermission.GroupsCreate })
    private async createGroup(client: Client, interaction: ChatInputCommandInteraction) {
        const name = interaction.options.getString("name", true);
        const role = interaction.options.getRole("role", true);

        try {
            const group = await prismaClient.group.create({
                data: {
                    name: name,
                    roleId: role.id,
                },
            });
            await interaction.reply({ content: `Group **${group.name}** created with ID **${group.id}** linked to role <@&${role.id}>.`, flags: [MessageFlags.Ephemeral]  });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "An error occurred while creating the group.", flags: [MessageFlags.Ephemeral]  });
        }
    }

    @Subcommand({ name: "update", permission: EPermission.GroupsUpdate })
    private async updateGroup(client: Client, interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getInteger("id", true);
        const name = interaction.options.getString("name");
        const role = interaction.options.getRole("role");

        if (!name && !role) {
            await interaction.reply({ content: "You must provide at least one field to update (name or role).", flags: [MessageFlags.Ephemeral]  });
            return;
        }

        try {
            const data: any = {};
            if (name) data.name = name;
            if (role) data.roleId = role.id;

            const group = await prismaClient.group.update({
                where: { id: id },
                data: data,
            });
            await interaction.reply({ content: `Group **${group.id}** updated.`, flags: [MessageFlags.Ephemeral]  });
        } catch (error) {
            console.error(error);
            // Check if error is RecordNotFound
            await interaction.reply({ content: "An error occurred while updating the group. Check if the ID is correct.", flags: [MessageFlags.Ephemeral]  });
        }
    }

    @Subcommand({ name: "delete", permission: EPermission.GroupsDelete })
    private async deleteGroup(client: Client, interaction: ChatInputCommandInteraction) {
        const id = interaction.options.getInteger("id", true);

        try {
            await prismaClient.group.delete({
                where: { id: id },
            });
            await interaction.reply({ content: `Group **${id}** deleted.`, flags: [MessageFlags.Ephemeral]  });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: "An error occurred while deleting the group. Check if the ID is correct.", flags: [MessageFlags.Ephemeral]  });
        }
    }
}
