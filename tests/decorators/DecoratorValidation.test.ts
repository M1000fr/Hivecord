import { describe, test, expect } from "bun:test";
import { Command } from "@decorators/Command";
import { Event } from "@decorators/Event";
import { Module } from "@decorators/Module";
import { Subcommand } from "@decorators/Subcommand";
import { DefaultCommand } from "@decorators/DefaultCommand";
import { BotPermission } from "@decorators/BotPermission";
import { Autocomplete } from "@decorators/Autocomplete";
import { OptionRoute } from "@decorators/OptionRoute";
import { BaseCommand } from "@class/BaseCommand";
import { BaseEvent } from "@class/BaseEvent";
import { PermissionsBitField } from "discord.js";

describe("Decorator Validations", () => {
	describe("@Command decorator", () => {
		test("should throw error when used on non-BaseCommand class", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class InvalidCommand {}
			}).toThrow("@Command decorator can only be used on classes extending BaseCommand");
		});

		test("should work when used on BaseCommand class", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class ValidCommand extends BaseCommand {
                    override async execute(client: any, interaction: any) {}
                }
			}).not.toThrow();
		});
	});

	describe("@Event decorator", () => {
		test("should throw error when used on non-BaseEvent class", () => {
			expect(() => {
				@Event({ name: "ready" })
				class InvalidEvent {}
			}).toThrow("@Event decorator can only be used on classes extending BaseEvent");
		});

		test("should work when used on BaseEvent class", () => {
			expect(() => {
				@Event({ name: "ready" })
				class ValidEvent extends BaseEvent<"ready"> {
					run() {}
				}
			}).not.toThrow();
		});
	});

	describe("@Module decorator", () => {
		test("should work on any class", () => {
			expect(() => {
				@Module({ name: "Test" })
				class TestModule {}
			}).not.toThrow();
		});
	});

	describe("@Subcommand decorator", () => {
		test("should throw error when used on non-BaseCommand class method", () => {
			expect(() => {
				class InvalidClass {
					@Subcommand({ name: "test" })
					testMethod() {}
				}
			}).toThrow("@Subcommand decorator can only be used on methods of classes extending BaseCommand");
		});

		test("should work when used on BaseCommand class method", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class ValidCommand extends BaseCommand {
					@Subcommand({ name: "sub" })
					subMethod() {}
                    override async execute(client: any, interaction: any) {}
				}
			}).not.toThrow();
		});
	});

	describe("@DefaultCommand decorator", () => {
		test("should throw error when used on non-BaseCommand class method", () => {
			expect(() => {
				class InvalidClass {
					@DefaultCommand()
					testMethod() {}
				}
			}).toThrow("@DefaultCommand decorator can only be used on methods of classes extending BaseCommand");
		});

		test("should work when used on BaseCommand class method", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class ValidCommand extends BaseCommand {
					@DefaultCommand()
					run() {}
                    override async execute(client: any, interaction: any) {}
				}
			}).not.toThrow();
		});
	});

	describe("@BotPermission decorator", () => {
		test("should throw error when used on non-BaseCommand class method", () => {
			expect(() => {
				class InvalidClass {
					@BotPermission(PermissionsBitField.Flags.Administrator)
					testMethod() {}
				}
			}).toThrow("@BotPermission decorator can only be used on methods of classes extending BaseCommand");
		});

		test("should work when used on BaseCommand class method", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class ValidCommand extends BaseCommand {
					@BotPermission(PermissionsBitField.Flags.Administrator)
					@DefaultCommand()
					run() {}
                    override async execute(client: any, interaction: any) {}
				}
			}).not.toThrow();
		});
	});

	describe("@Autocomplete decorator", () => {
		test("should throw error when used on non-BaseCommand class method", () => {
			expect(() => {
				class InvalidClass {
					@Autocomplete({ optionName: "test" })
					testMethod() {}
				}
			}).toThrow("@Autocomplete decorator can only be used on methods of classes extending BaseCommand");
		});

		test("should work when used on BaseCommand class method", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class ValidCommand extends BaseCommand {
					@Autocomplete({ optionName: "option" })
					override async handleAutocomplete(client: any, interaction: any) {}
                    override async execute(client: any, interaction: any) {}
				}
			}).not.toThrow();
		});
	});

	describe("@OptionRoute decorator", () => {
		test("should throw error when used on non-BaseCommand class method", () => {
			expect(() => {
				class InvalidClass {
					@OptionRoute({ option: "action", value: "test" })
					testMethod() {}
				}
			}).toThrow("@OptionRoute decorator can only be used on methods of classes extending BaseCommand");
		});

		test("should work when used on BaseCommand class method", () => {
			expect(() => {
				@Command({ name: "test", description: "test" })
				class ValidCommand extends BaseCommand {
					@OptionRoute({ option: "action", value: "create" })
					create() {}
                    override async execute(client: any, interaction: any) {}
				}
			}).not.toThrow();
		});
	});
});
