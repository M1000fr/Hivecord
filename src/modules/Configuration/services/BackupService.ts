import type { LeBotClient } from "@class/LeBotClient";
import {
	EConfigType,
	type ConfigPropertyOptions,
} from "@decorators/ConfigProperty";
import { ConfigService } from "@services/ConfigService";
import { Injectable } from "@src/decorators/Injectable";
import { Logger } from "@utils/Logger";
import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "crypto";

interface ConfigValue {
	value: string | string[];
	type: EConfigType;
}

interface ModuleConfig {
	moduleName: string;
	configurations: Record<string, ConfigValue>;
}

interface BackupData {
	timestamp: string;
	version: number;
	modules: ModuleConfig[];
}

class CryptoHelper {
	private static readonly ALGORITHM = "aes-256-cbc";
	private static readonly SALT = "salt";
	private static readonly KEY_LENGTH = 32;
	private static readonly IV_LENGTH = 16;

	private static getKey(): Buffer {
		const secret =
			process.env.BACKUP_SECRET || "default-secret-key-change-me";
		return scryptSync(secret, this.SALT, this.KEY_LENGTH);
	}

	static encrypt(text: string): string {
		const iv = randomBytes(this.IV_LENGTH);
		const cipher = createCipheriv(this.ALGORITHM, this.getKey(), iv);
		const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
		return `${iv.toString("hex")}:${encrypted.toString("hex")}`;
	}

	static decrypt(text: string): string {
		const parts = text.split(":");
		if (parts.length < 2) throw new Error("Invalid encrypted text format");

		const ivHex = parts[0]!;
		const encryptedParts = parts.slice(1);
		const iv = Buffer.from(ivHex, "hex");
		const encryptedText = Buffer.from(encryptedParts.join(":"), "hex");
		const decipher = createDecipheriv(this.ALGORITHM, this.getKey(), iv);
		const decrypted = Buffer.concat([
			decipher.update(encryptedText),
			decipher.final(),
		]);
		return decrypted.toString();
	}
}

class ConfigExtractor {
	static async extractModuleConfig(
		configService: ConfigService,
		moduleName: string,
		configClass: {
			configProperties?: Record<string, ConfigPropertyOptions>;
		},
		guildId: string,
	): Promise<ModuleConfig> {
		const configProperties = configClass?.configProperties || {};
		const configurations: Record<string, ConfigValue> = {};

		for (const [propertyKey, options] of Object.entries(configProperties)) {
			const opt = options;
			const snakeCaseKey = this.toSnakeCase(propertyKey);

			const value = await this.getConfigValue(
				configService,
				guildId,
				snakeCaseKey,
				opt.type,
			);
			if (value !== null) {
				configurations[snakeCaseKey] = { value, type: opt.type };
			}
		}

		return { moduleName, configurations };
	}

	private static async getConfigValue(
		configService: ConfigService,
		guildId: string,
		key: string,
		type: EConfigType,
	): Promise<string | string[] | null> {
		if (type === EConfigType.Role) {
			// Check if it's a multi-role configuration
			const roles = await configService.getRoles(guildId, key);
			if (roles.length > 0) return roles;

			const role = await configService.getRole(guildId, key);
			return role ? [role] : null;
		}
		if (type === EConfigType.Channel) {
			return await configService.getChannel(guildId, key);
		}
		return await configService.get(guildId, key);
	}

	private static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	}
}

class ConfigRestorer {
	static async restoreModuleConfig(
		configService: ConfigService,
		moduleConfig: ModuleConfig,
		guildId: string,
	): Promise<void> {
		for (const [key, configValue] of Object.entries(
			moduleConfig.configurations,
		)) {
			const { value, type } = configValue;

			if (type === EConfigType.Role) {
				if (Array.isArray(value)) {
					if (value.length === 1 && value[0]) {
						await configService.setRole(guildId, key, value[0]);
					} else if (value.length > 1) {
						await configService.setRoles(guildId, key, value);
					}
				}
			} else if (type === EConfigType.Channel) {
				if (typeof value === "string") {
					await configService.setChannel(guildId, key, value);
				}
			} else {
				if (typeof value === "string") {
					await configService.set(guildId, key, value);
				}
			}
		}
	}
}

@Injectable()
export class BackupService {
	private readonly logger = new Logger("BackupService");
	private static readonly BACKUP_VERSION = 3;

	constructor(private readonly configService: ConfigService) {}

	async createBackup(
		client: LeBotClient<true>,
		guildId: string,
	): Promise<Buffer> {
		this.logger.log("Creating modular configuration backup...");

		const modules: ModuleConfig[] = [];

		for (const [moduleName, moduleData] of client.modules) {
			const configClass = moduleData.options.config as unknown as
				| { configProperties?: Record<string, ConfigPropertyOptions> }
				| undefined;
			if (configClass?.configProperties) {
				const moduleConfig = await ConfigExtractor.extractModuleConfig(
					this.configService,
					moduleName,
					configClass,
					guildId,
				);

				if (Object.keys(moduleConfig.configurations).length > 0) {
					modules.push(moduleConfig);
					this.logger.log(
						`Backed up ${Object.keys(moduleConfig.configurations).length} configs for ${moduleName}`,
					);
				}
			}
		}

		const backupData: BackupData = {
			timestamp: new Date().toISOString(),
			version: BackupService.BACKUP_VERSION,
			modules,
		};

		const json = JSON.stringify(backupData, null, 2);
		const encrypted = CryptoHelper.encrypt(json);
		this.logger.log(`Backup created with ${modules.length} modules`);
		return Buffer.from(encrypted, "utf-8");
	}

	async restoreBackup(buffer: Buffer, guildId: string): Promise<void> {
		this.logger.log("Restoring modular configuration backup...");

		try {
			const encrypted = buffer.toString("utf-8");
			const json = CryptoHelper.decrypt(encrypted);
			const backup: BackupData = JSON.parse(json);

			if (backup.version !== BackupService.BACKUP_VERSION) {
				this.logger.warn(
					`Backup version mismatch: expected ${BackupService.BACKUP_VERSION}, got ${backup.version}`,
				);
			}

			this.logger.log(
				`Restoring ${backup.modules.length} modules from ${backup.timestamp}`,
			);

			for (const moduleConfig of backup.modules) {
				this.logger.log(`Restoring ${moduleConfig.moduleName}...`);
				await ConfigRestorer.restoreModuleConfig(
					this.configService,
					moduleConfig,
					guildId,
				);
				this.logger.log(
					`Restored ${Object.keys(moduleConfig.configurations).length} configs for ${moduleConfig.moduleName}`,
				);
			}

			this.logger.log("Backup restored successfully.");
		} catch (error) {
			this.logger.error(
				"Failed to restore backup",
				(error as Error)?.stack || String(error),
			);
			throw error;
		}
	}

	// Legacy methods for backward compatibility
	static encrypt(text: string): string {
		return CryptoHelper.encrypt(text);
	}

	static decrypt(text: string): string {
		return CryptoHelper.decrypt(text);
	}
}
