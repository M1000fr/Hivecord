import { LocalizationMap } from "discord.js";

export enum ConfigContextVariable {
  User = "user",
  Guild = "guild",
  Member = "member",
  Invite = "invite",
}

export const ConfigContextData: Record<
  ConfigContextVariable,
  {
    description: string;
    descriptionLocalizations?: LocalizationMap;
  }
> = {
  [ConfigContextVariable.User]: {
    description: "The user involved",
    descriptionLocalizations: {
      fr: "L'utilisateur concerné",
    },
  },
  [ConfigContextVariable.Guild]: {
    description: "The server",
    descriptionLocalizations: {
      fr: "Le serveur",
    },
  },
  [ConfigContextVariable.Member]: {
    description: "The guild member",
    descriptionLocalizations: {
      fr: "Le membre du serveur",
    },
  },
  [ConfigContextVariable.Invite]: {
    description: "The invite used",
    descriptionLocalizations: {
      fr: "L'invitation utilisée",
    },
  },
};
