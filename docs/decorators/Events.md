# Events (@EventController & @On)

Hivecord uses a decoration system to listen for Discord API events. This allows grouping event-related logic into dedicated classes and benefiting from dependency injection.

## @EventController

This decorator marks a class as an event controller. Classes decorated with `@EventController` are automatically registered as singletons, and their methods decorated with `@On` are attached to the Discord client.

```typescript
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Client } from "@decorators/params/Client";
import { HivecordClient } from "@class/HivecordClient";

@EventController()
export class ReadyEvent {
	@On({ name: "ready", once: true })
	async onReady(@Client() client: HivecordClient<true>) {
		console.log(`Logged in as ${client.user.tag}!`);
	}
}
```

## @On

The `@On` decorator is placed on a method to specify which Discord event it should listen for.

### Configuration

It can take either the event name as a `string` (or a `BotEvents` enum value) or an `EventOptions` configuration object.

| Property | Type      | Description                                                              |
| :------- | :-------- | :----------------------------------------------------------------------- |
| `name`   | `string`  | The name of the Discord event (e.g., `messageCreate`, `guildMemberAdd`). |
| `once`   | `boolean` | If `true`, the listener will only execute once.                          |

### Injecting Event Parameters

To access the arguments provided by the Discord event, you must use the `@Context()` decorator. It returns an array containing all event arguments (e.g., `[message]` for `messageCreate`).

```typescript
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Context } from "@decorators/params/Context";
import { BotEvents } from "@enums/BotEvents";
import type { ContextOf } from "@src/types/ContextOf";

@EventController()
export class MessageEvent {
	@On(BotEvents.MessageCreate)
	async onMessage(@Context() [message]: ContextOf<"messageCreate">) {
		console.log("Message received:", message.content);
	}
}
```

### Example with options

```typescript
import { EventController } from "@decorators/EventController";
import { On } from "@decorators/On";
import { Context } from "@decorators/params/Context";
import type { ContextOf } from "@src/types/ContextOf";

@EventController()
export class MemberJoinEvent {
	@On({ name: "guildMemberAdd", once: false })
	async handleJoin(@Context() [member]: ContextOf<"guildMemberAdd">) {
		console.log(`${member.user.tag} joined the server.`);
	}
}
```

## Key Points

1. **Auto-injection**: Since `@EventController` classes are `@Injectable`, you can inject services into their constructor.
2. **Parameter Injection**: You **must** use decorators to retrieve parameters. Use `@Context()` to get the event arguments array and `@Client()` to get the bot instance.
3. **Typing with ContextOf**: Use the `ContextOf<"eventName">` utility type to correctly type the array destructuring in your `@Context()` parameter.
4. **Registration**: Don't forget to add the controller class to the `providers` array of your `@Module`.

---

[Back to table of contents](./README.md)