import {
  type ApplicationCommandOptionData,
  InteractionContextType,
  type LocalizationMap,
  type PermissionResolvable,
} from "discord.js";

export interface CommandOptions {
  name: string;
  description: string;
  nameLocalizations?: LocalizationMap;
  descriptionLocalizations?: LocalizationMap;
  options?: ApplicationCommandOptionData[];
  defaultMemberPermissions?: PermissionResolvable;
  contexts?: InteractionContextType[];
}
