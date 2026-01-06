# LeBot

A modular and high-performance Discord bot written in TypeScript, optimized for execution with [Bun](https://bun.sh).

## Features

- **Modular Architecture**: Code organization by modules (General, Configuration, CustomEmbed, etc.).
- **Dependency Injection**: Robust system for service and instance management.
- **Dynamic Configuration**: Direct access to configuration via the `guild.config` object.
- **Internationalization (i18n)**: Built-in multi-language support with `guild.i18n()`.
- **Persistence**: Using Prisma (MariaDB) and high-performance caching with Redis.

## Project Structure

```text
.
├── docs/           # Detailed documentation
├── prisma/         # Database schema and migrations
├── scripts/        # Utility and maintenance scripts
└── src/            # Source code
    ├── class/      # Base classes (LeBotClient, Pager, etc.)
    ├── decorators/ # Custom decorators for the modular system
    ├── di/         # Dependency Injection container
    ├── enums/      # Shared enums
    ├── interceptors/ # Interaction interceptors
    ├── interfaces/ # TypeScript interfaces
    ├── locales/    # Translation files (i18n)
    ├── modules/    # Feature modules (Configuration, General, etc.)
    ├── prisma/     # Prisma client and database adapter
    ├── registers/  # Component registries
    ├── repositories/ # Data access layer (Prisma)
    ├── types/      # Custom type definitions
    ├── utils/      # Helper functions and services
    ├── Bootstrap.ts # Bot initialization logic
    ├── bot.ts       # Discord client setup
    └── index.ts     # Application entry point
```

## Prerequisites

- [Bun](https://bun.sh) (v1.x)
- A MariaDB or MySQL database
- A Redis instance

## Installation

1. Install dependencies:

    ```
    bun install
    ```

2. Configure your environment (`.env`) with your Discord token and connection URLs (DB/Redis).

3. Deploy the database:
    ```
    bunx prisma migrate deploy
    ```

## Running

For development with hot-reloading:

```
bun dev
```

For production:

```
bun start
```

## Scripts

- `bun dev`: Starts the bot in development mode.
- `bun start`: Deploys migrations and starts the bot in production mode.
- `bun run typecheck`: Runs TypeScript type checking.
- `bun run lint`: Checks for code style issues.
- `bun run format`: Formats the code using Prettier.
- `bun run i18n:info`: Shows translation coverage and missing keys.

## Modules Architecture

Each module in `src/modules` follows a structured pattern:

- **Module Class**: Entry point defined with `@Module`.
- **Controllers**: Handle commands (`@SlashCommandController`) and events (`@EventController`).
- **Services**: Business logic marked with `@Injectable`.
- **Config**: Dynamic configuration schemas using `@ModuleConfig`.

Example module structure:

```text
modules/MyModule/
├── commands/      # Slash commands
├── events/        # Event listeners
├── services/      # Business logic
└── MyModule.ts    # Module definition
```

## Development

LeBot uses a decorator system inspired by frameworks like NestJS to facilitate development.

### Main Decorators

- `@Module`: Defines a module and its dependencies (services, commands, events).
- `@Injectable`: Marks a class as an injectable service.
- `@Inject`: Injects a dependency into a constructor.
- `@SlashCommandController`: Defines a Slash command.
- `@SlashCommand`: Marks a method as a command entry point.

👉 **[See the complete decorators documentation](./docs/decorators/README.md)**

---

_This project uses Bun for ultra-fast execution._
