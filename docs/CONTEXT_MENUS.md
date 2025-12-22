# Context Menu Commands

Ce système permet de créer des commandes accessibles depuis le menu contextuel (clic droit) sur les utilisateurs et les messages dans Discord.

## Types de Context Menus

### User Context Menu
Accessible via clic droit sur un utilisateur

### Message Context Menu  
Accessible via clic droit sur un message

## Utilisation

### User Context Menu Command

```typescript
import { UserCommand } from "@decorators/UserCommand";
import { Context } from "@decorators/params/Context";
import { TargetUser } from "@decorators/params/TargetUser";
import type { UserCommandContext } from "@src/types/UserCommandContext";
import { User } from "discord.js";

@UserCommand({ name: "Get Avatar" })
export class GetAvatarCommand {
    async execute(
        @Context() [interaction]: UserCommandContext,
        @TargetUser() user: User,
    ) {
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Avatar ${user.username}`)
                    .setImage(user.displayAvatarURL({ size: 4096 })),
            ],
        });
    }
}
```

### Message Context Menu Command

```typescript
import { MessageCommand } from "@decorators/MessageCommand";
import { Context } from "@decorators/params/Context";
import { TargetMessage } from "@decorators/params/TargetMessage";
import type { MessageCommandContext } from "@src/types/MessageCommandContext";
import { Message } from "discord.js";

@MessageCommand({ name: "Copy Message" })
export class CopyMessageCommand {
    async execute(
        @Context() [interaction]: MessageCommandContext,
        @TargetMessage() message: Message,
    ) {
        return interaction.reply({
            content: message.content || "(No text content)",
        });
    }
}
```

## Décorateurs disponibles

### Décorateurs de classe

- `@UserCommand({ name: string, defaultMemberPermissions?: string })` - Définit une commande de menu contextuel utilisateur
- `@MessageCommand({ name: string, defaultMemberPermissions?: string })` - Définit une commande de menu contextuel message

### Décorateurs de paramètres

- `@Context()` - Injecte le contexte de l'interaction `[interaction]`
- `@TargetUser()` - Injecte l'utilisateur ciblé (pour UserCommand)
- `@TargetMessage()` - Injecte le message ciblé (pour MessageCommand)
- `@Client()` - Injecte le client Discord
- `@GuildLanguage()` - Injecte le contexte de langue du serveur

## Enregistrement

Ajoutez votre commande dans le tableau `commands` de votre module :

```typescript
@Module({
    name: "MonModule",
    commands: [GetAvatarCommand, CopyMessageCommand],
})
export class MonModule {}
```

## Différences avec les Slash Commands

1. **Pas de méthode nommée** : Utilisez toujours `execute` comme nom de méthode
2. **Pas de subcommands** : Les context menus ne supportent pas les sous-commandes
3. **Pas d'options** : Les context menus n'ont pas de paramètres additionnels
4. **Contexte simplifié** : L'élément ciblé (user/message) est automatiquement injecté

## Exemples concrets

### Voir les informations d'un utilisateur

```typescript
@UserCommand({ name: "User Info" })
export class UserInfoCommand {
    async execute(
        @Context() [interaction]: UserCommandContext,
        @TargetUser() user: User,
    ) {
        const member = interaction.guild?.members.cache.get(user.id);
        
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`Info: ${user.tag}`)
                    .setThumbnail(user.displayAvatarURL())
                    .addFields(
                        { name: "ID", value: user.id },
                        { name: "Created", value: user.createdAt.toLocaleDateString() },
                        { name: "Joined", value: member?.joinedAt?.toLocaleDateString() || "N/A" },
                    ),
            ],
        });
    }
}
```

### Traduire un message

```typescript
@MessageCommand({ name: "Translate" })
export class TranslateCommand {
    async execute(
        @Context() [interaction]: MessageCommandContext,
        @TargetMessage() message: Message,
    ) {
        // Logic pour traduire le message
        const translated = await translateText(message.content);
        
        return interaction.reply({
            content: `**Original:** ${message.content}\n**Translated:** ${translated}`,
            ephemeral: true,
        });
    }
}
```
