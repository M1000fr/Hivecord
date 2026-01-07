import { BaseConfigInteractions } from "@class/BaseConfigInteractions";
import { ConfigInteraction } from "@decorators/ConfigInteraction";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import { SelectMenu } from "@decorators/Interaction";
import { Interaction } from "@decorators/params";
import { CustomIdHelper } from "@utils/CustomIdHelper";
import {
  ActionRowBuilder,
  type ButtonBuilder,
  type Locale,
  type RepliableInteraction,
  StringSelectMenuBuilder,
  type StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from "discord.js";

@ConfigInteraction()
export class StringChoiceConfigInteractions extends BaseConfigInteractions {
  @SelectMenu("module_config_choice:*")
  async handleChoiceSelection(
    @Interaction() interaction: StringSelectMenuInteraction,
  ) {
    const ctx = await this.getHandleContext(interaction);
    if (!ctx) return;
    const { client, moduleName, propertyKey, propertyOptions } = ctx;
    const value = interaction.values[0];

    if (value) {
      await this.updateConfig(
        client,
        interaction,
        moduleName,
        propertyKey,
        value,
        propertyOptions.type,
        false,
        true,
      );
    }
  }

  async show(
    interaction: RepliableInteraction,
    propertyOptions: ConfigPropertyOptions,
    selectedProperty: string,
    moduleName: string,
  ) {
    const { t, embed, messageId, currentValue } = await this.getShowContext(
      interaction,
      moduleName,
      selectedProperty,
      propertyOptions,
    );

    const choices = propertyOptions.choices || [];
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(
        CustomIdHelper.build([
          "module_config_choice",
          moduleName,
          selectedProperty,
          messageId,
          interaction.user.id,
        ]),
      )
      .setPlaceholder(t("utils.config_helper.select_placeholder"))
      .addOptions(
        choices.map((choice) => {
          const label =
            choice.nameLocalizations?.[interaction.locale as Locale] ||
            choice.name;
          return new StringSelectMenuOptionBuilder()
            .setLabel(label)
            .setValue(String(choice.value))
            .setDefault(String(choice.value) === String(currentValue));
        }),
      );

    const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      selectMenu,
    );

    const buttonRow = new ActionRowBuilder<ButtonBuilder>();

    if (!propertyOptions.nonNull) {
      buttonRow.addComponents(
        this.createClearButton(
          moduleName,
          selectedProperty,
          interaction.user.id,
          t,
          messageId,
        ),
      );
    }

    buttonRow.addComponents(
      this.createCancelButton(
        moduleName,
        selectedProperty,
        interaction.user.id,
        t,
      ),
    );

    await interaction.reply({
      embeds: [embed],
      components: [row, buttonRow],
    });
  }
}
