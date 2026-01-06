# LeBot

Un bot Discord modulaire et performant écrit en TypeScript, optimisé pour l'exécution avec [Bun](https://bun.sh).

## Fonctionnalités

- **Architecture Modulaire** : Organisation du code par modules (General, Configuration, CustomEmbed, etc.).
- **Injection de Dépendances** : Système robuste pour la gestion des services et des instances.
- **Configuration Dynamique** : Accès direct à la configuration via l'objet `guild.config`.
- **Internationalisation (i18n)** : Support multi-langue intégré avec `guild.i18n()`.
- **Persistance** : Utilisation de Prisma (MariaDB) et cache haute performance avec Redis.

## Prérequis

- [Bun](https://bun.sh) (v1.x)
- Une base de données MariaDB ou MySQL
- Une instance Redis

## Installation

1. Installez les dépendances :

    ```bash
    bun install
    ```

2. Configurez votre environnement (`.env`) avec votre token Discord et les URLs de connexion (DB/Redis).

3. Déployez la base de données :
    ```bash
    bunx prisma migrate deploy
    ```

## Lancement

Pour le développement avec rechargement automatique :

```bash
bun dev
```

Pour la production :

```bash
bun start
```

---

_Ce projet utilise Bun pour une exécution ultra-rapide._
