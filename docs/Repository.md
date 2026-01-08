# :icon-database: Repository

The `@Repository` decorator is a specialized version of `@Injectable` designed specifically for the data access layer. It marks a class as a managed provider that handles database operations, typically using Prisma.

Using `@Repository` instead of `@Injectable` for your data services makes your architecture semantically clearer and follows the **Repository Pattern**.

---

## :icon-pencil: Usage

Apply `@Repository()` to your class. You can then inject your database service (like `PrismaService`) into the constructor to perform queries.

=== :icon-code: Example
```typescript
import { Repository } from "@decorators/Repository";
import { PrismaService } from "@src/prisma/PrismaService";

@Repository()
export class UserRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findById(id: string) {
        return this.prisma.user.findUnique({
            where: { id }
        });
    }

    async updateGold(id: string, amount: number) {
        return this.prisma.user.update({
            where: { id },
            data: { gold: { increment: amount } }
        });
    }
}
```
===

---

## :icon-workflow: Why use Repositories?

| Benefit | Description |
| :--- | :--- |
| **Separation of Concerns** | Keeps your business logic (Services) separate from your database queries. |
| **Reusability** | Common queries can be reused across multiple modules or services. |
| **Testability** | You can easily mock a Repository when testing your business logic. |
| **Maintainability** | If your database schema changes, you only need to update the Repository, not the entire app. |

---

## :icon-link: Injection

Just like any other injectable component, Repositories must be registered in a module's `providers` array and can be injected into Services or Controllers.

```typescript
@Module({
    providers: [UserRepository, UserService],
    exports: [UserRepository]
})
export class UserModule {}
```

---

[!ref text="Back to Inject" icon="arrow-left"](Inject.md)
[!ref text="Interceptors" icon="arrow-right"](Interceptors.md)