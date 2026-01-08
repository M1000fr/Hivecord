## [2.4.1](https://github.com/M1000fr/Hivecord/compare/v2.4.0...v2.4.1) (2026-01-08)


### Bug Fixes

* update Retype to v2 and fix output directory ([70d26f6](https://github.com/M1000fr/Hivecord/commit/70d26f69a9ae6e2e965eb8b885bad229677bf3da))

# [2.4.0](https://github.com/M1000fr/Hivecord/compare/v2.3.0...v2.4.0) (2026-01-08)


### Bug Fixes

* **core:** ensure interaction handlers resolve from the correct module context ([9b46466](https://github.com/M1000fr/Hivecord/commit/9b464668f2cd8ee56e44caecbca11a3fdf9e7cfa))


### Features

* **examples:** add Modal example with LabelBuilder syntax ([bf70500](https://github.com/M1000fr/Hivecord/commit/bf70500fdd66f0fa048b2b80ea60c1c8b06dcfe6))
* **types:** add interaction context types and update button example ([0f24121](https://github.com/M1000fr/Hivecord/commit/0f24121aa9546f8169f66c39d5113eca63863a95))

# [2.3.0](https://github.com/M1000fr/Hivecord/compare/v2.2.0...v2.3.0) (2026-01-08)


### Bug Fixes

* resolve command collisions by indexing by type and name ([ea65aba](https://github.com/M1000fr/Hivecord/commit/ea65aba728eb5af1cd67641af85ed5c66991641a))
* **types:** use PermissionResolvable for context menu commands ([72ef375](https://github.com/M1000fr/Hivecord/commit/72ef375ba192a074320973413a39a8c7657418a8))


### Features

* add user and message command examples with identical names to test collision fix ([5d76506](https://github.com/M1000fr/Hivecord/commit/5d76506b92421f42a6e950508cc3d3bd998baa67))
* **interfaces:** add type property to CommandOptions and clean up ModuleLoader ([c45f02c](https://github.com/M1000fr/Hivecord/commit/c45f02c0295a1bfe6393f794afe1d19ad81d05b6))

# [2.2.0](https://github.com/M1000fr/Hivecord/compare/v2.1.0...v2.2.0) (2026-01-08)


### Bug Fixes

* **husky:** convert pre-push line endings to LF for CI compatibility ([c762a80](https://github.com/M1000fr/Hivecord/commit/c762a8061403674ba0fe4e2523d556c0e21c34e0))


### Features

* **client:** initialize hot-reload and pass arguments to shards ([4e74b1e](https://github.com/M1000fr/Hivecord/commit/4e74b1ece155a80fb37894c7e1cfa1505fd4e32d))
* **di:** add support for clearing modules and instances ([db11ba6](https://github.com/M1000fr/Hivecord/commit/db11ba6f775b4c008da0193ec30cc6e58e0ec3bc))
* **hot-reload:** add HotReloadService for file watching and module swapping ([8bf60e2](https://github.com/M1000fr/Hivecord/commit/8bf60e25867eb03e1df3e0ab3923973fe62b6995))
* **i18n:** unify audit and clean logic into a single script with flags ([d9c8aef](https://github.com/M1000fr/Hivecord/commit/d9c8aef04e9fff3467898de0b4379f4723bba674))
* **loader:** implement granular provider and module hot-reloading ([8778994](https://github.com/M1000fr/Hivecord/commit/8778994878f50e10442b98940b9cfebdc7b2423b))

# [2.1.0](https://github.com/M1000fr/Hivecord/compare/v2.0.0...v2.1.0) (2026-01-07)


### Features

* add ping command for example ([db8bc25](https://github.com/M1000fr/Hivecord/commit/db8bc259bf0eb833931c347ca9928d540a0110f0))

# [2.0.0](https://github.com/M1000fr/Hivecord/compare/v1.0.0...v2.0.0) (2026-01-07)


### Bug Fixes

* add @Injectable() decorator to EmbedEditorInteractions ([73a4bf3](https://github.com/M1000fr/Hivecord/commit/73a4bf3b1946cf0b308421f38a32e111dcb4c454))
* add @Interaction() decorator to all config interaction handlers ([2720688](https://github.com/M1000fr/Hivecord/commit/272068805c7dc10fa6bf024ea007b9a8bca36478))
* add Array.isArray check for params metadata ([28ce83b](https://github.com/M1000fr/Hivecord/commit/28ce83bde5d1617ce4125674c5954064b6bada88))
* add explicit constructors to repository classes for proper DI ([a94ace2](https://github.com/M1000fr/Hivecord/commit/a94ace26ed978ea775af691772caa17e0e1ac598))
* add instanceof Map check for optionRoutes iteration ([3759588](https://github.com/M1000fr/Hivecord/commit/3759588fd32b5a4594c6bbb9b6e36a5a7897d659))
* **ci:** ignore main branch for pull requests ([9cc7d6e](https://github.com/M1000fr/Hivecord/commit/9cc7d6e25c7275cb2b51eb8cc79bb68c187bff48))
* **config:** correct proxy typing and restore runtime stability ([f2ab8a8](https://github.com/M1000fr/Hivecord/commit/f2ab8a8f79e0b93348a5eb0e6cfca2b13bd6e132))
* **config:** ensure language consistency and improve default value handling ([e27ef1b](https://github.com/M1000fr/Hivecord/commit/e27ef1ba1a99d87a2f0bd4dbc1216333de213589))
* **config:** fix missing CustomIdHelper imports and language property error ([17bdcdb](https://github.com/M1000fr/Hivecord/commit/17bdcdbd3148f6446f70a12698f02e2934fda3b8))
* **config:** fix snake_case conversion and enhance config helper ([c316483](https://github.com/M1000fr/Hivecord/commit/c316483dd476e9f7aeb7c6f38a230572a3d2b70f))
* **config:** implement default value handling and display ([7651ad6](https://github.com/M1000fr/Hivecord/commit/7651ad61ffbf6b03606f680c33709ef8864a7283))
* **config:** improve UI flow, interaction detection and message cleanup ([4bffabd](https://github.com/M1000fr/Hivecord/commit/4bffabd806b0e016ac69fb038c68ea0e12f927c3))
* **config:** restore missing EConfigType runtime import in ConfigService ([20b4f49](https://github.com/M1000fr/Hivecord/commit/20b4f498d27244504be3d9560b34213df6d9276a))
* **core:** conditionally clear global commands ([9f76f0c](https://github.com/M1000fr/Hivecord/commit/9f76f0c2b1152eb71988af71307a29f483429c1a))
* **core:** ensure global commands are cleared in debug mode ([7637e14](https://github.com/M1000fr/Hivecord/commit/7637e1478c90746a824306d9f38acc4ee95dcadd))
* correct method names in ConfigService and apply formatting ([8ca70e1](https://github.com/M1000fr/Hivecord/commit/8ca70e10a621f34cf1503a111510de490a4834b0))
* correct TypeScript errors after defaultValue removal ([6f054ec](https://github.com/M1000fr/Hivecord/commit/6f054ec8e056b18e163a20bce2ddcc70547dc0af))
* **decorators:** ensure paramtypes metadata in @Injectable ([1ca4820](https://github.com/M1000fr/Hivecord/commit/1ca4820806bb39c0bb9a4348718aeca3caeb2b4e))
* **di:** set LeBotClient scope to global and refactor interaction decorators ([e06d131](https://github.com/M1000fr/Hivecord/commit/e06d13123b4f520d6004cbae9be160603ac7a729))
* drop guildId default ([b505113](https://github.com/M1000fr/Hivecord/commit/b505113011ba814b59c35a148058c4a65d998183))
* enforce parameter decorator usage in OnConfigUpdate ([9fbf76d](https://github.com/M1000fr/Hivecord/commit/9fbf76d3e0402217567c9cd042658dd50ba5f0a3))
* **lint:** remove any types and unused imports ([7eb9ed3](https://github.com/M1000fr/Hivecord/commit/7eb9ed3372b8e9020bc9d357707cd9c36cf8798d))
* **logger:** fix double stack trace and filter debug/verbose logs ([5cd6c3b](https://github.com/M1000fr/Hivecord/commit/5cd6c3bdcc5b4cf98c367eea8aca4257f35edc8e))
* move missing repository and provider registrations to CoreModule ([f5f94ae](https://github.com/M1000fr/Hivecord/commit/f5f94aef12db82a687fd8f4581d41e68c9449e7a))
* register missing repositories in CoreModule ([5ae0c19](https://github.com/M1000fr/Hivecord/commit/5ae0c1983d2e2d5a4849c42b694f7dc39ea4444f))
* remove Proxy wrapper from @Injectable decorator ([cf60a83](https://github.com/M1000fr/Hivecord/commit/cf60a83c36127e469d168d7353aad5806161d061))
* resolve dependency injection and type-only import issues ([9e11cfa](https://github.com/M1000fr/Hivecord/commit/9e11cfab4ce866b8d7d3d660712865049ea1304d))
* resolve lint errors and warnings in audit script and OnConfigUpdate decorator ([dc35e82](https://github.com/M1000fr/Hivecord/commit/dc35e82ec61f1138cb5a15cadaccfe2247cdd95e))
* **services:** cleanup logs and connection handling ([bfcf5b9](https://github.com/M1000fr/Hivecord/commit/bfcf5b9e2451d32aeea63a7c7625ec15415e8fec))
* **tsc:** resolve prisma mapping errors and missing EConfigType.ChannelArray ([d63d272](https://github.com/M1000fr/Hivecord/commit/d63d2720b4f7b687c081b38e3fbd0f96bbd157b4))
* **type:** fix typescript types import ([f5b02c5](https://github.com/M1000fr/Hivecord/commit/f5b02c5b01d0a1a0e8c82c50feedd8d649a06221))
* **types:** handle unknown error types in shutdown handlers ([3c6454f](https://github.com/M1000fr/Hivecord/commit/3c6454f3094412bc4219624b80de9527adf4f980))
* **types:** resolve typecheck errors and improve IGuildConfig for module augmentation ([5760207](https://github.com/M1000fr/Hivecord/commit/5760207aa9f8c689a5b60237352b0064f2e51de2))
* use explicit imports for repositories in EntityService to avoid circular dependency issues ([d115511](https://github.com/M1000fr/Hivecord/commit/d11551156843c6518c2c01f01c7dab4a3b6a5800))
* wrap AutocompleteInteraction in array for proper destructuring ([6a854f7](https://github.com/M1000fr/Hivecord/commit/6a854f7715aab235175ceb0ff8b0ce7c96e86320))


### Code Refactoring

* unify module architecture with single providers array ([3ae1425](https://github.com/M1000fr/Hivecord/commit/3ae142556718dabd5fdc3c8f425a09f4bea6724f))


### Features

* add @ConfigInteraction decorator for config interactions ([45f0d70](https://github.com/M1000fr/Hivecord/commit/45f0d7001febd4e1045cc3a988676cfe30f00c3a))
* add @Repository decorator for automatic DI setup ([fa096fe](https://github.com/M1000fr/Hivecord/commit/fa096fe44ae51a3a6fd676e6d53473eee5dcdfe7))
* add CommandAutocompleteContext type ([431ef97](https://github.com/M1000fr/Hivecord/commit/431ef979695d9fd958f712f65b6f4b60139ef97a))
* add GuildLanguageContext interface to unify locale and translation function ([03375db](https://github.com/M1000fr/Hivecord/commit/03375dbe7417aaf25c461202db2b59f617467920))
* add support for context menu commands (user and message) ([3d0c517](https://github.com/M1000fr/Hivecord/commit/3d0c51788c0b560cfd418f17d681470bd8995428))
* add validation for @Injectable() decorator on module classes ([2eeb3d9](https://github.com/M1000fr/Hivecord/commit/2eeb3d91e58c003c34f968e182e85e12eaece0fc))
* **app:** import CustomEmbedModule in AppModule ([b28ce41](https://github.com/M1000fr/Hivecord/commit/b28ce41a178ef688cb41dea4bce05d0493429d49))
* auto-apply @Injectable() in command and event decorators ([fc6c3d6](https://github.com/M1000fr/Hivecord/commit/fc6c3d6e5d1a4bb1aaf96e635679fbd27ac85e18))
* **commands:** add @CommandPermission decorator and CommandPermissionInterceptor ([54b8f6e](https://github.com/M1000fr/Hivecord/commit/54b8f6ef90d707ab1ab86302987b11688e17e216))
* **commands:** add Pager demo to ping command ([aa37ac6](https://github.com/M1000fr/Hivecord/commit/aa37ac664e628efa78eb68da4b6e16df03316028))
* **config:** add dynamic config type registry ([a7bcef5](https://github.com/M1000fr/Hivecord/commit/a7bcef5ac17e3536447f28ce917670e756f88496))
* **config:** add dynamic guild configuration and i18n to Guild object ([9dffc1a](https://github.com/M1000fr/Hivecord/commit/9dffc1a97be02eb3f2067413b66c511f62584bd9))
* **config:** add emojis to all General module config properties ([6555a92](https://github.com/M1000fr/Hivecord/commit/6555a9239ddd52de1d175055797355d94e11a9d0))
* **config:** add optional emoji to ConfigProperty and display it in UI ([e30b9b6](https://github.com/M1000fr/Hivecord/commit/e30b9b68f7551d12624ffea77eb16424aee8c59b))
* **config:** add type-safe configuration keys for GeneralConfig ([8b21304](https://github.com/M1000fr/Hivecord/commit/8b2130469bf2af531e5466ed389cbf6c6dd1c003))
* **config:** implement dynamic config type framework and specialized handlers ([7940318](https://github.com/M1000fr/Hivecord/commit/7940318616addf57d21e1f9296cb6f741319744f))
* **config:** implement native dynamic configuration type framework ([3b640e3](https://github.com/M1000fr/Hivecord/commit/3b640e3dfb526fb201d663149f9407da482420be))
* **core:** add interceptors infrastructure and @UseInterceptors decorator ([920dad3](https://github.com/M1000fr/Hivecord/commit/920dad31e7556d017297b4ebfcb30da64983e476))
* **core:** add module type distinction ([d79b80c](https://github.com/M1000fr/Hivecord/commit/d79b80c848df8263a8c6fd3f64afe5cba2e1259e))
* **core:** clear global commands in debug mode ([d376e16](https://github.com/M1000fr/Hivecord/commit/d376e168796e434115c41d2b796111d8800c7902))
* **core:** create PagerService as injectable service ([c47499f](https://github.com/M1000fr/Hivecord/commit/c47499f3856becba2ebd34c09651e74b939f8914))
* **core:** extract command deployment logic to CommandDeploymentService ([a8d734c](https://github.com/M1000fr/Hivecord/commit/a8d734cf9d6798ff30a24de16b8f53529eb1d293))
* **core:** extract module loading logic to ModuleLoader ([e981df4](https://github.com/M1000fr/Hivecord/commit/e981df4ebc688a6192e2f0f6fcaf59494d477569))
* **core:** implement Bootstrap and AppModule ([bd9307d](https://github.com/M1000fr/Hivecord/commit/bd9307db0e89a6aebac40473fdd9c88e0e1392c2))
* **core:** implement module imports ([6a2bb08](https://github.com/M1000fr/Hivecord/commit/6a2bb0889d9c343012789db3d73066573e713d9d))
* **core:** implement new decorators and update CommandService for DI ([2f123cc](https://github.com/M1000fr/Hivecord/commit/2f123cc3f0a3984ae9f84fe37fc4680be7261e76))
* **core:** initialize reflect-metadata at app bootstrap ([4d8f99e](https://github.com/M1000fr/Hivecord/commit/4d8f99e21dd96562008529dffb2837d687237bfd))
* **core:** integrate GuildConfig parameter resolution in commands and events ([b5e1589](https://github.com/M1000fr/Hivecord/commit/b5e1589c69fcb86af454e656d30b16e13ff8740c))
* **core:** register PagerService in CoreModule ([b32dd69](https://github.com/M1000fr/Hivecord/commit/b32dd6915c2be4c6093e3b4cf1091dcda0464a02))
* **core:** update core architecture for dependency injection ([ecbd98a](https://github.com/M1000fr/Hivecord/commit/ecbd98a5fdc20763a40cf56f9bdee8227855d219))
* **decorators:** add GuildConfig parameter decorator with type-safe keys ([18aa467](https://github.com/M1000fr/Hivecord/commit/18aa4672a5c03e77c47264c999e317a576d4b789))
* **decorators:** introduce @Injectable, @Inject, and @Service for DI providers ([f08960d](https://github.com/M1000fr/Hivecord/commit/f08960df6271ebb71e740f1337b1bec11653a89c))
* **di:** add DependencyContainer and provider typing with global and module scopes ([e4dd2ac](https://github.com/M1000fr/Hivecord/commit/e4dd2acca6e8c3ba7405ca1705ee7194f4e0d2a5))
* **di:** enforce dependency injection usage ([785103f](https://github.com/M1000fr/Hivecord/commit/785103f92fbbe606612db4996316fc63e64f5064))
* **di:** enhance container with circular detection, transient scope and aliasing ([6cb7ffe](https://github.com/M1000fr/Hivecord/commit/6cb7ffed1a7c9f648416c6d58a86cf5a044bc7ba))
* enhance i18n audit script and add i18n:info command ([e1da36d](https://github.com/M1000fr/Hivecord/commit/e1da36d3f48d8f75ac405f9f99bcdadf919df84c))
* **env:** validate environment variables and centralize config ([f38a5dc](https://github.com/M1000fr/Hivecord/commit/f38a5dc6c75bf94d8cdb35992b91407eab7cede1))
* **healthcheck:** add docker healthcheck script ([6ac5fed](https://github.com/M1000fr/Hivecord/commit/6ac5fed681c0c90a4190f08b578656be33a6d9c5))
* **i18n:** add pager translations for navigation buttons ([a82d88c](https://github.com/M1000fr/Hivecord/commit/a82d88c90dad237084492c09512df38468dff155))
* **i18n:** export TFunction type from I18nService ([aed6b5c](https://github.com/M1000fr/Hivecord/commit/aed6b5c3e9a901f79be2b368823d2dd59bfd1bb6))
* infer subcommand name from method name ([c62550c](https://github.com/M1000fr/Hivecord/commit/c62550cd2a8b956ed965f46bb6246dd2d09fc2ec))
* **lifecycle:** implement graceful shutdown ([5226f4e](https://github.com/M1000fr/Hivecord/commit/5226f4e7e32da2b51f6cf21362fc523ee9228541))
* **modules:** create CustomEmbed module ([e68fe07](https://github.com/M1000fr/Hivecord/commit/e68fe076c6c830ca026be6d59691858107d63432))
* **modules:** register module services as providers/exports and mark services @Service for DI ([432191a](https://github.com/M1000fr/Hivecord/commit/432191a7a566438808cab881078c9803695371de))
* **module:** support providers, exports, and global scope; store module options via metadata ([5117aef](https://github.com/M1000fr/Hivecord/commit/5117aef4b3afd85d967517825db49d61c8f5b269))
* **params:** add @Interaction() parameter decorator ([9a6634c](https://github.com/M1000fr/Hivecord/commit/9a6634ccb3e843a7e641a42b71ddac0a0ea6e19f))


### Performance Improvements

* **init:** parallelize service startup and add timing logs ([0a91d2d](https://github.com/M1000fr/Hivecord/commit/0a91d2d7005fc96dead06da9e5b54f27704dcf2c))


### BREAKING CHANGES

* Remove commands and events arrays from ModuleOptions

- Add ProviderType ('service' | 'command' | 'event') to DI system
- Add PROVIDER_TYPE_METADATA_KEY for type discrimination
- Update all decorators to add provider type metadata:
  - @EventController sets type='event'
  - @CommandController/@UserCommand/@MessageCommand set type='command'
  - Regular @Injectable defaults to type='service'
- Create getProvidersByType utility to filter providers by type
- Update ModuleOptions to only use 'providers' array
- Remove deprecated 'commands' and 'events' arrays
- Refactor all modules to use unified providers array
- Simplify LeBotClient validation and loading logic
- Remove backward compatibility code

All providers (services, commands, events) are now registered in a single
'providers' array, with their type determined by decorator metadata. This
creates a more consistent and maintainable architecture.

## [1.0.1-dev.1](https://github.com/M1000fr/Hivecord/compare/v1.0.0...v1.0.1-dev.1) (2025-12-20)

### Bug Fixes

- **ci:** ignore main branch for pull requests ([9cc7d6e](https://github.com/M1000fr/Hivecord/commit/9cc7d6e25c7275cb2b51eb8cc79bb68c187bff48))

# [1.0.0-dev.5](https://github.com/M1000fr/Hivecord/compare/v1.0.0-dev.4...v1.0.0-dev.5) (2025-12-20)

### Bug Fixes

- **ci:** ignore main branch for pull requests ([9cc7d6e](https://github.com/M1000fr/Hivecord/commit/9cc7d6e25c7275cb2b51eb8cc79bb68c187bff48))

# [1.0.0-dev.4](https://github.com/M1000fr/Hivecord/compare/v1.0.0-dev.3...v1.0.0-dev.4) (2025-12-20)

### Bug Fixes

- add DATABASE_URL environment variable for Prisma Client generation ([69813c4](https://github.com/M1000fr/Hivecord/commit/69813c4b5cfdcb6ed5bc28fbbb296ec2f39614ab))
- extract version from package.json for Docker image tagging ([50aaff6](https://github.com/M1000fr/Hivecord/commit/50aaff6e0b1c542b16e67ff8b7a959abe42b7d85))

# [1.0.0-dev.3](https://github.com/M1000fr/Hivecord/compare/v1.0.0-dev.2...v1.0.0-dev.3) (2025-12-20)

### Bug Fixes

- **Achievement:** allow announcement channel to be GuildAnnouncement type ([f029296](https://github.com/M1000fr/Hivecord/commit/f029296b7254c04295d5b8316b41bbca0b11606c))
- **Achievement:** use static strings for config keys to avoid runtime issues ([f8309bf](https://github.com/M1000fr/Hivecord/commit/f8309bf1514ccb3c4da432e09f33f3cf47062e9f))
- add language support to welcome message templates ([0a63f53](https://github.com/M1000fr/Hivecord/commit/0a63f53d8f31e90661fa447a25751ced422d3872))
- add localization for unknown value in message templates ([77e6c17](https://github.com/M1000fr/Hivecord/commit/77e6c172731592177868fc3112551fa7ab2b2675))
- **cd:** ensure Docker containers are stopped before deployment ([11ff628](https://github.com/M1000fr/Hivecord/commit/11ff628f3b17661c55a8d1287d5ab75ab11d2536))
- **cd:** trigger workflow only on push to main ([0e19244](https://github.com/M1000fr/Hivecord/commit/0e1924425fa78b3da0247a0ec0d1c446897237ff))
- **config:** ensure string config updates refresh the main embed ([492ce9d](https://github.com/M1000fr/Hivecord/commit/492ce9dec7866123d2fe23d4593dc0998f3f77c2))
- **config:** invalidate cache on set to ensure consistency ([99a1fe9](https://github.com/M1000fr/Hivecord/commit/99a1fe993050456cab2e1b148701cfb7e0551721))
- **ConfigProperty:** restrict type to EConfigType for consistency ([dc55bb0](https://github.com/M1000fr/Hivecord/commit/dc55bb0f1870fd6152b336b4ee5e18c59f40e6cb))
- **config:** rename button label from "Clear Value" to "Default Value" ([a08e6e9](https://github.com/M1000fr/Hivecord/commit/a08e6e99736b76bcec65fd6aa67308eac6c2e9de))
- **deploy:** add docker compose pull before bringing down services ([43a178d](https://github.com/M1000fr/Hivecord/commit/43a178d58258d252d8a129a02d91d52e825649d5))
- enhance error logging during Hivecord startup ([e8648fa](https://github.com/M1000fr/Hivecord/commit/e8648fabe4dec8f750d5f42a46d6d1c107ec73a1))
- ensure ephemeral replies for ban command interactions ([86cd284](https://github.com/M1000fr/Hivecord/commit/86cd284d84feae8bc15814c3175ddc239e785d68))
- ensure InteractionHelper.defer is called in syncWelcomeRoles method ([89e78c6](https://github.com/M1000fr/Hivecord/commit/89e78c631ffae7a63ce313f0f7922721f5f17fde))
- **general:** use soft delete for channels and fix interaction flags ([963d430](https://github.com/M1000fr/Hivecord/commit/963d4300a6df2b14727d1fd6c92a2b471010928c))
- **gitignore:** add instructions file to .gitignore ([aa95478](https://github.com/M1000fr/Hivecord/commit/aa95478c5a5182230e09bae7b27dce091b06210d))
- **gitignore:** update GitHub instructions entry to ignore all files in instructions folder ([6375176](https://github.com/M1000fr/Hivecord/commit/63751765f82745000cfea2affb6b356de4d7b848))
- improve error handling during module loading and bot startup ([5435cc6](https://github.com/M1000fr/Hivecord/commit/5435cc634f4ec0ac2f0498145881c46f0057af74))
- integrate InteractionHelper for consistent interaction handling in debug command ([a75a9ba](https://github.com/M1000fr/Hivecord/commit/a75a9ba760f1a4a8edb205009413751c778cc967))
- integrate InteractionHelper for defer and respond in InvitesCommand ([ac9a93f](https://github.com/M1000fr/Hivecord/commit/ac9a93f80348cc1457e733abb4531830b7c96164))
- integrate InteractionHelper for response handling in SanctionsCommand ([f0b965a](https://github.com/M1000fr/Hivecord/commit/f0b965ae9016fade3d7bf77f216b3cbcf5650f23))
- integrate InteractionHelper for response handling in SecurityCommand ([a0c1245](https://github.com/M1000fr/Hivecord/commit/a0c12459c75c600ad9eb9acac7b74b19077d6886))
- integrate InteractionHelper for response handling in StatsCommand ([a8b8cf1](https://github.com/M1000fr/Hivecord/commit/a8b8cf1691922968acf85745d2fde043749ac1f5))
- **InteractionHelper:** change default ephemeral response to false ([7ae87b0](https://github.com/M1000fr/Hivecord/commit/7ae87b07f0586959e2ce137538b5750a5e4de671))
- **InteractionHelper:** change default ephemeral response to false ([8a4b252](https://github.com/M1000fr/Hivecord/commit/8a4b2523b2216ca793009224cd30d64378ad46b6))
- **Invitation:** update UserStats inviteCount on new invitation ([77010f2](https://github.com/M1000fr/Hivecord/commit/77010f26532f0018c89e5ae362af4d581c9b9289))
- refactor interaction handling to use InteractionHelper for consistency ([1bc9f17](https://github.com/M1000fr/Hivecord/commit/1bc9f17864f63b01b666b21feaa1cf29fe3d7604))
- remove unused AchievementSeed permission for cleaner code ([b8d4b94](https://github.com/M1000fr/Hivecord/commit/b8d4b949c4f68e2acb41861e48b20f5cebc97171))
- reorder group permission constants for improved organization ([d58cfb0](https://github.com/M1000fr/Hivecord/commit/d58cfb053d8f04f80a9688be9582e1c7fcf81557))
- resolve typecheck and lint errors in TicketCommand ([e344a84](https://github.com/M1000fr/Hivecord/commit/e344a8443aee87453d3753564ff2294e4546bc67))
- streamline InteractionHelper.defer calls in GroupCommand subcommands ([a7b7da8](https://github.com/M1000fr/Hivecord/commit/a7b7da872669342d3df6e464e8c14d05841437ea))
- **ticket:** add validation to prevent sending empty ticket creation messages ([84b2f34](https://github.com/M1000fr/Hivecord/commit/84b2f34a0179fd2279b73d07bbcbcaf553800e62))
- **ticket:** display username instead of ID in autocomplete ([7f2e3d3](https://github.com/M1000fr/Hivecord/commit/7f2e3d330d77c8ee1d0d0138e5cbf7a943601493))
- **ticket:** fix autocomplete response and logic ([56bc690](https://github.com/M1000fr/Hivecord/commit/56bc690c63c3e2831c30d4ce673b7d8963ea3263))
- **ticket:** ignore channel deletion error when closing ticket ([ddf3763](https://github.com/M1000fr/Hivecord/commit/ddf37638cca61733a44faf9aa976c532c2d4e973))
- update clear command to use editReply for invalid amount response ([1505eee](https://github.com/M1000fr/Hivecord/commit/1505eeea3ebb9bb7514bcacbbf6985013ab6afd1))
- update commands to use editReply for improved response handling ([a37520b](https://github.com/M1000fr/Hivecord/commit/a37520b170b512384259f73a19f7d654f987de96))
- update error response to use InteractionReplyOptions for ephemeral messages ([0bfd900](https://github.com/M1000fr/Hivecord/commit/0bfd9006f793ba10e9e9602ec79e432f1dc50008))
- update interaction responses to use unified respond method for consistency ([4adfbe8](https://github.com/M1000fr/Hivecord/commit/4adfbe8ba1a58e670023347c6c5d7f5d2fd9e3ad))
- update PingCommand to use InteractionHelper for consistent response handling ([f83a900](https://github.com/M1000fr/Hivecord/commit/f83a9008a5f5d735fb8cb3af28cf89d6e679ea5b))
- update response handling to use InteractionHelper for consistency ([2663bf4](https://github.com/M1000fr/Hivecord/commit/2663bf4df10a32ca2f15f67b4d8c7114a949488a))

### Features

- **Achievement:** add customizable announcement message template for achievements ([5b877a1](https://github.com/M1000fr/Hivecord/commit/5b877a11308ff7eadf16ccd2d7b4a292c00bc5b1))
- **Achievement:** add localization support for display names and descriptions in achievement configuration ([3751e8f](https://github.com/M1000fr/Hivecord/commit/3751e8f4300b5ddc4f5f672be98f70551b27a293))
- **Achievement:** add management commands (add, edit, delete) and remove seed ([6c9ae23](https://github.com/M1000fr/Hivecord/commit/6c9ae2318d78b5ad6686ef830d8a322c4de99c36))
- **Achievement:** add new achievement types and stats fields ([92274ea](https://github.com/M1000fr/Hivecord/commit/92274ea898e26069684b665e69e02db7c5fa6d85))
- **Achievement:** enhance achievement commands with internationalization and additional messages ([953c9da](https://github.com/M1000fr/Hivecord/commit/953c9daf106073c2dae030489c8147096c05d929))
- **achievement:** implement achievement system with user stats tracking and commands ([224bd4d](https://github.com/M1000fr/Hivecord/commit/224bd4d492ced08279944e96b0218f3580cbdbe1))
- **Achievement:** refactor achievement checks to use type mapping and improve user/guild handling ([efb92f3](https://github.com/M1000fr/Hivecord/commit/efb92f39fb2ccbe717c055d90b566e6ca187af1d))
- **Achievement:** update success messages to include detailed achievement information ([1ca148c](https://github.com/M1000fr/Hivecord/commit/1ca148c9c23a71cf3f67a8ee1d5aa26c9b62663f))
- add ModuleConfig decorator and enforce its usage in Module decorator ([4b9f1d3](https://github.com/M1000fr/Hivecord/commit/4b9f1d387aa3332be3104804443c21255eb784bb))
- **cd:** add environment variables for Docker login in deployment step ([b32e382](https://github.com/M1000fr/Hivecord/commit/b32e382ec9408b86c9fea8180b02bfd2f7022e08))
- **config:** add cancel button to configuration interactions ([9fd36db](https://github.com/M1000fr/Hivecord/commit/9fd36db1ca55d3540bcacc646038f49d2db3dad8))
- **config:** add custom embed configuration interaction ([0d0f64a](https://github.com/M1000fr/Hivecord/commit/0d0f64ab34b79c8a3ef4f2e1eca6d67e9366903c))
- **config:** enhance configuration system and add StringArray support ([ac1869b](https://github.com/M1000fr/Hivecord/commit/ac1869bfda90d4edaf0d61db6f421bdc9996725a))
- **ConfigProperty:** allow type to accept both keyof EConfigType and EConfigType ([4736ade](https://github.com/M1000fr/Hivecord/commit/4736adeb0d710eda2c1f095119ab89723bb80102))
- **i18n:** integrate translation service into command execution ([687983c](https://github.com/M1000fr/Hivecord/commit/687983cda34f0bc9cdab55885d5574bc67314805))
- **locales:** add field labels for role permissions in English and French translations ([6984be2](https://github.com/M1000fr/Hivecord/commit/6984be28cb95c572bf37d0ae14e3221fabb7a5b7))
- **moderation:** enhance sanction scheduler with mute consistency checks and cache usage ([1c07e16](https://github.com/M1000fr/Hivecord/commit/1c07e160fac9d30ddaffd10a233f724bcb46072d))
- **moderation:** re-apply mute role on member join if sanction is active ([5f3111f](https://github.com/M1000fr/Hivecord/commit/5f3111f28489d398f861197874f920ee21271c5a))
- **package.json:** add check:errors script for type checking and linting ([cc1e120](https://github.com/M1000fr/Hivecord/commit/cc1e1203460e66dc62ebf4cbdd9918fe08487b13))
- **pre-push:** replace typecheck and lint commands with check:errors script ([69e6a35](https://github.com/M1000fr/Hivecord/commit/69e6a3533b3c954c051afd7d00ce96137d86c0d3))
- **Statistics:** implement logic for new achievement types ([fad191e](https://github.com/M1000fr/Hivecord/commit/fad191ec833f4bc9319be82b94486dd4fa1b0fcd))
- **ticket:** add support role configuration and close ticket button ([91c2ad8](https://github.com/M1000fr/Hivecord/commit/91c2ad872e7da9d047ea91063041d97eab226db7))
- **ticket:** add ticket closing logic and command ([d0e79e3](https://github.com/M1000fr/Hivecord/commit/d0e79e33be94e6e0f91f89a2b1dba6da181d463b))
- **ticket:** add ticket module ([4b4382c](https://github.com/M1000fr/Hivecord/commit/4b4382cdf63c9c1b4c4a01a5e95e90a3212403b0))
- **ticket:** enhance localization for ticket configuration properties ([79af151](https://github.com/M1000fr/Hivecord/commit/79af151ffb8d0b5a783ca4ccb8d7f78e689bbbb8))
