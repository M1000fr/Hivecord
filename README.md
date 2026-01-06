# LeBot

A modular and high-performance Discord bot written in TypeScript, optimized for execution with [Bun](https://bun.sh).

## Features

- **Modular Architecture**: Code organization by modules (General, Configuration, CustomEmbed, etc.).
- **Dependency Injection**: Robust system for service and instance management.
- **Dynamic Configuration**: Direct access to configuration via the `guild.config` object.
- **Internationalization (i18n)**: Built-in multi-language support with `guild.i18n()`.
- **Persistence**: Using Prisma (MariaDB) and high-performance caching with Redis.

## Prerequisites

- [Bun](https://bun.sh) (v1.x)
- A MariaDB or MySQL database
- A Redis instance

## Installation

1. Install dependencies:

    ```/dev/null/install.sh#L1-1
    bun install
    ```

2. Configure your environment (`.env`) with your Discord token and connection URLs (DB/Redis).

3. Deploy the database:
    ```/dev/null/migrate.sh#L1-1
    bunx prisma migrate deploy
    ```

## Running

For development with hot-reloading:

```/dev/null/dev.sh#L1-1
bun dev
```

For production:

```/dev/null/start.sh#L1-1
bun start
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