# Hivecord

A modular and high-performance Discord bot framework written in TypeScript, optimized for [Bun](https://bun.sh).

:::v-stack
!![Modular Architecture](https://img.shields.io/badge/Architecture-Modular-orange?style=for-the-badge)
!![Dependency Injection](https://img.shields.io/badge/DI-Inversify--style-blue?style=for-the-badge)
!![High Performance](https://img.shields.io/badge/Runtime-Bun-black?style=for-the-badge)
:::

---

## ![:icon-rocket: Quick Start]

Dive into the documentation to learn how to build your own modules.

[!ref icon="book" text="Read the Documentation" target="blank"](/)
[!ref icon="zap" text="Get Started" variant="primary"](Module.md)

---

## ![:icon-star: Key Features]

### ![:icon-cpu: Modular Architecture]
Organize your code by features. Each module is self-contained with its own commands, events, and services.

### ![:icon-link: Dependency Injection]
Robust system for service and instance management. No more manual singleton handling.

### ![:icon-gear: Dynamic Configuration]
Direct access to guild-specific configuration via the `guild.config` object with real-time updates.

### ![:icon-globe: Internationalization]
Built-in multi-language support. Translate your bot easily with `guild.i18n()` and automated key checking.

---

## ![:icon-package: Core Components]

:::grid
{ "columns": 2 }

> ### ![:icon-terminal: Slash Commands]
> Define commands using decorators. Supports subcommands, autocomplete, and parameter injection.
> [Learn more](SlashCommand.md)

> ### ![:icon-zap: Interactions]
> Handle buttons, select menus, and modals with simple method decorators and wildcard routing.
> [Learn more](Interactions.md)

> ### ![:icon-database: Persistence]
> Powered by **Prisma** (MariaDB/MySQL) and high-performance caching with **Redis**.
> [Learn more](Advanced.md#data-repositories-repository)

> ### ![:icon-shield: Interceptors]
> Apply middleware-like logic for permissions, logging, or validation at the class or method level.
> [Learn more](Interceptors.md)
:::

---

## ![:icon-tools: Project Structure]

```text
.
├── docs/           # Detailed documentation (Retype)
├── prisma/         # Database schema and migrations
├── src/            # Source code
│   ├── class/      # Base framework classes
│   ├── decorators/ # Interaction & DI decorators
│   ├── modules/    # Feature modules (The core of your bot)
│   └── index.ts    # Application entry point
```

---

## ![:icon-terminal: Installation]

=== :icon-package: Install
```bash
bun install
```
=== :icon-database: Database
```bash
# Configure .env first
bunx prisma migrate deploy
```
=== :icon-play: Run
```bash
bun dev # Hot-reload
bun start # Production
```
===

---

[!ref text="View Decorators API" icon="arrow-right"](/)

:::footer
&copy; {{ year }} Hivecord. Built with :icon-heart: using Bun and Retype.
:::