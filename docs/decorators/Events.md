# Events (@EventController & @On)

LeBot uses a decoration system to listen for Discord API events. This allows grouping event-related logic into dedicated classes and benefiting from dependency injection.

## @EventController

This decorator marks a class as an event controller. Classes decorated with `@EventController` are automatically registered as singletons, and their methods decorated with `@On` are attached to the Discord client.

```typescript
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";

@EventController()
export class ReadyEvent {
    @On("ready")
    async onReady() {
        console.log("The bot is ready!");
    }
}
```

## @On

The `@On` decorator is placed on a method to specify which Discord event it should listen for.

### Configuration

It can take either the event name as a `string` or an `EventOptions` configuration object.

| Property | Type      | Description                                                              |
| :------- | :-------- | :----------------------------------------------------------------------- |
| `name`   | `string`  | The name of the Discord event (e.g., `messageCreate`, `guildMemberAdd`). |
| `once`   | `boolean` | If `true`, the listener will only execute once.                          |

### Example with options

```typescript
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { GuildMember } from "discord.js";

@EventController()
export class MemberJoinEvent {
    @On({ name: "guildMemberAdd", once: false })
    async handleJoin(member: GuildMember) {
        console.log(`${member.user.tag} joined the server.`);
    }
}
```

## Key Points

1. **Auto-injection**: Since `@EventController` classes are `@Injectable`, you can inject services into their constructor.
2. **Arguments**: Decorated methods receive the same arguments as those provided by the corresponding `discord.js` event.
3. **Registration**: Don't forget to add the controller class to the `providers` array of your `@Module`.

---

[Back to table of contents](./README.md)
