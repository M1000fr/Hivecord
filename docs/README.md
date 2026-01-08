---
order: 1000
title: Introduction
icon: home
---

# :icon-workflow: Hivecord

A modular and high-performance Discord bot framework written in TypeScript, optimized for [Bun](https://bun.sh).

:::v-stack
![Architecture](https://img.shields.io/badge/Architecture-Modular-orange?style=flat-square)
![DI](https://img.shields.io/badge/DI-Inversify--style-blue?style=flat-square)
![Runtime](https://img.shields.io/badge/Runtime-Bun-black?style=flat-square)
:::

---

## :icon-rocket: Quick Start

Dive into the documentation to learn how to build your own modules.

[!ref icon="book" text="Architecture Overview" variant="primary"](module/module.md)
[!ref icon="zap" text="Slash Commands" variant="success"](commands/slash-command.md)

---

## :icon-star: Key Features

### :icon-cpu: Modular Architecture
Organize your code by features. Each module is self-contained with its own commands, events, and services.

### :icon-link: Dependency Injection
Robust system for service and instance management. No more manual singleton handling.

### :icon-gear: Dynamic Configuration
Direct access to guild-specific configuration via the `guild.config` object with real-time updates.

### :icon-globe: Internationalization
Built-in multi-language support. Translate your bot easily with `guild.i18n()` and automated key checking.

---

## :icon-package: Core Components

:::grid

> ### :icon-terminal: SlashCommand
> Define commands using decorators. Supports subcommands, autocomplete, and parameter injection.
> [Learn more](commands/slash-command.md)

> ### :icon-zap: Interactions
> Handle buttons, select menus, and modals with simple method decorators and wildcard routing.
> [Learn more](components/overview.md)

> ### :icon-database: Persistence
> Powered by **Prisma** (MariaDB/MySQL) and high-performance caching with **Redis**.
> [Learn more](utils/advanced.md)

> ### :icon-shield: Interceptors
> Apply middleware-like logic for permissions, logging, or validation at the class or method level.
> [Learn more](core/interceptors.md)
:::

---

## :icon-tools: Project Structure

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

## :icon-terminal: Installation

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

[!ref text="View Decorators API" icon="arrow-right"](module/module.md)

:::footer
&copy; {{ year }} Hivecord. Built with :icon-heart: using Bun and Retype.
:::
