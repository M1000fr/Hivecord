# :icon-broadcast: EventController

The `@EventController` decorator is used to mark a class as a container for Discord event listeners. This allows you to group related event handlers (like logging, moderation, or member tracking) into a single, modular class.

!!! info "Event Organization"
Instead of having a single massive file for all your `client.on()` listeners, Hivecord uses Controllers to keep your event logic clean and separated by domain.
!!!

---

## :icon-pencil: Usage

To handle events, apply the `@EventController` decorator to a class. For the listeners within the class to be active, the class must be registered in a module's `controllers` array.

=== :icon-code: Example
```typescript
import { EventController, On } from "@decorators/Interaction";
import { Message, Events } from "discord.js";

@EventController()
export class MessageLoggingController {
    @On(Events.MessageCreate)
    async onMessage(@Context() [message]: [Message]) {
        console.log(`New message from ${message.author.tag}: ${message.content}`);
    }

    @On(Events.MessageDelete)
    async onDelete(@Context() [message]: [Message]) {
        console.log(`A message was deleted in ${message.channelId}`);
    }
}
```
===

---

## :icon-gear: Configuration

Unlike command controllers, `@EventController` does not usually require additional metadata, but it serves as a critical flag for Hivecord's loader to scan the class for `@On` or `@Once` methods.

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | (Optional) A friendly name for the controller used in debug logs. |

---

## :icon-link: Dependency Injection

Since Event Controllers are part of the Hivecord lifecycle, you can inject any service or repository into their constructor to use within your event handlers.

```typescript
@EventController()
export class WelcomeController {
    constructor(private readonly database: UserRepository) {}

    @On(Events.GuildMemberAdd)
    async onJoin(@Context() [member]: [GuildMember]) {
        // Use the injected service
        await this.database.recordJoin(member.id);
    }
}
```

---

## :icon-workflow: Key Benefits

1.  **Automatic Attachment**: Hivecord automatically binds the methods to the Discord client during the bootstrap process.
2.  **Modular Logic**: Group "Audit Log" events in one controller and "Leveling" events in another.
3.  **Scoped Context**: Every event handler has access to the same class-level services and state.

---

[!ref text="Back to Home" icon="arrow-left"](/)
[!ref text="On" icon="arrow-right"](Events.md)