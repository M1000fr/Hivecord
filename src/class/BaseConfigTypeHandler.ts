import { LeBotClient } from "@class/LeBotClient";
import type { ConfigPropertyOptions } from "@decorators/ConfigProperty";
import {
  CONFIG_TYPE_METADATA_KEY,
  type ConfigTypeMetadata,
} from "@decorators/ConfigType";
import { ConfigService } from "@modules/Configuration/services/ConfigService";
import type { ConfigTypeHandler } from "@registers/ConfigTypeRegistry";
import { ConfigTypeRegistry } from "@registers/ConfigTypeRegistry";
import { ConfigUIBuilderService } from "@utils/ConfigUIBuilderService";
import { ConfigValueResolverService } from "@utils/ConfigValueResolverService";
import { ConfigValueService } from "@utils/ConfigValueService";
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  type RepliableInteraction,
  StringSelectMenuInteraction,
} from "discord.js";
import { BaseConfigInteractions } from "./BaseConfigInteractions";

export abstract class BaseConfigTypeHandler
  extends BaseConfigInteractions
  implements ConfigTypeHandler
{
  constructor(
    valueService: ConfigValueService,
    uiBuilder: ConfigUIBuilderService,
    resolverService: ConfigValueResolverService,
    configService: ConfigService,
  ) {
    super(valueService, uiBuilder, resolverService, configService);

    const metadata = Reflect.getMetadata(
      CONFIG_TYPE_METADATA_KEY,
      this.constructor,
    ) as ConfigTypeMetadata;

    if (metadata) {
      ConfigTypeRegistry.register({
        id: metadata.id,
        name: metadata.name,
        handler: this,
      });
    }
  }

  abstract show(
    interaction: RepliableInteraction,
    propertyOptions: ConfigPropertyOptions,
    selectedProperty: string,
    moduleName: string,
  ): Promise<void>;

  async handleUpdate?(
    interaction:
      | StringSelectMenuInteraction
      | ButtonInteraction
      | ChatInputCommandInteraction,
    client: LeBotClient,
    moduleName: string,
    propertyKey: string,
    value: unknown,
  ): Promise<void> {
    // Default implementation (can be overridden)
    const { propertyOptions } = this.getPropertyContext(
      client as LeBotClient<true>,
      moduleName,
      propertyKey,
    );
    if (propertyOptions) {
      await this.updateConfig(
        client as LeBotClient<true>,
        interaction,
        moduleName,
        propertyKey,
        value as string | string[],
        propertyOptions.type,
      );
    }
  }

  async formatValue?(_guildId: string, value: unknown): Promise<string> {
    return String(value);
  }

  /**
   * Register interactions for this handler.
   * Called automatically by LeBotClient after instantiation.
   */
  registerInteractions?(): void;
}
