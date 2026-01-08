---
order: 90
title: "On / @Once"
icon: clock
---

# :icon-clock: @On / @Once

Methods within an `@EventController` can be decorated with `@On` or `@Once` to listen for Discord events.

=== :icon-code: @On
```typescript
import { EventController, On, Context } from "@decorators/Interaction";
import { Events, Message } from "discord.js";

@EventController()
export class MyEventController {
    @On(Events.MessageCreate)
    async onMessage(@Context() [message]: [Message]) {
        if (message.author.bot) return;
        console.log(`Message received: ${message.content}`);
    }
}
```
===

---

## :icon-clock: @Once

If you want a listener to trigger only the **first time** an event occurs and then remove itself, use the `@Once` decorator instead.

```typescript
@On(Events.ClientReady)
async onReady() {
    console.log("Bot is online! (Triggers every time the client connects)");
}

@Once(Events.ClientReady)
async onFirstReady() {
    console.log("This only logs once during the initial startup.");
}
```

---

## :icon-sign-in: Parameter Injection

Methods decorated with `@On` or `@Once` use the `@Context()` decorator to receive the event arguments.

| Injector | Returns | Description |
| :--- | :--- | :--- |
| `@Context()` | `any[]` | An array of arguments passed by Discord.js for that specific event. |
| `@Client()` | `HivecordClient` | The bot client instance. |
| `@Inject()` | `any` | Any service or repository registered in your modules. |

!!! warning "Context Typing"
Unlike Slash Commands where `@Context()` is an object, for Events, `@Context()` returns an **array** matching the arguments of the event.
For example, `messageCreate` returns `[Message]`, while `guildMemberUpdate` returns `[GuildMember, GuildMember]`.
!!!

---

## :icon-light-bulb: Key Features

*   **Type Safety**: By using the `Events` enum, you ensure you're listening to valid Discord events.
*   **Automatic Cleanup**: Hivecord manages the listeners, ensuring they are properly attached when the module loads.
*   **Service Integration**: Easily call business logic inside your events by injecting services into the controller's constructor.

---
