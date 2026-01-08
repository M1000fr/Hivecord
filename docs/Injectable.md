# Dependency Injection (@Injectable & @Inject)

Hivecord integrates a powerful Dependency Injection (DI) system that helps manage object lifecycles and facilitates testing and modularity.

## @Injectable

The `@Injectable` decorator marks a class as manageable by the service container. A class marked this way can be automatically injected into other classes via their constructor.

### Example

```typescript
import { Injectable } from "@src/decorators/Injectable";

@Injectable()
export class DataService {
	getData() {
		return "Important data";
	}
}
```

## @Inject

The `@Inject` decorator is used in a class constructor to request the injection of a specific instance. The container will handle providing the corresponding instance (Singleton by default).

### Example

```typescript
import { Inject } from "@decorators/Inject";
import { DataService } from "../services/DataService";

export class MyCommand {
	constructor(@Inject(DataService) private dataService: DataService) {}

	async execute() {
		const data = this.dataService.getData();
		console.log(data);
	}
}
```

## Key Points

1. **Singleton**: By default, each injected class is a Singleton within the application.
2. **Lifecycle**: Instances are created when the module declaring them is loaded.
3. **Recursion**: The system automatically handles dependency chains (if Service A requires Service B, both will be instantiated in the correct order).

---

[Back to table of contents]/)
