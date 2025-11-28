import { prismaClient } from "./prismaService";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";
import { Logger } from "../utils/Logger";
import { ConfigService } from "./ConfigService";
import { ApplicationCommandOptionType } from "discord.js";
import type { LeBotClient } from "../class/LeBotClient";

interface ConfigValue {
	value: string | string[];
	type: ApplicationCommandOptionType;
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
		const secret = process.env.BACKUP_SECRET || "default-secret-key-change-me";
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
		const decrypted = Buffer.concat([decipher.update(encryptedText), decipher.final()]);
		return decrypted.toString();
	}
}

class ConfigExtractor {
	static async extractModuleConfig(moduleName: string, configClass: any): Promise<ModuleConfig> {
		const configProperties = configClass?.configProperties || {};
		const configurations: Record<string, ConfigValue> = {};

		for (const [propertyKey, options] of Object.entries(configProperties)) {
			const opt = options as any;
			const snakeCaseKey = this.toSnakeCase(propertyKey);

			const value = await this.getConfigValue(snakeCaseKey, opt.type);
			if (value !== null) {
				configurations[snakeCaseKey] = { value, type: opt.type };
			}
		}

		return { moduleName, configurations };
	}

	private static async getConfigValue(
		key: string,
		type: ApplicationCommandOptionType
	): Promise<string | string[] | null> {
		if (type === ApplicationCommandOptionType.Role) {
			// Check if it's a multi-role configuration
			const roles = await ConfigService.getRoles(key);
			if (roles.length > 0) return roles;
			
			const role = await ConfigService.getRole(key);
			return role ? [role] : null;
		}
		if (type === ApplicationCommandOptionType.Channel) {
			return await ConfigService.getChannel(key);
		}
		return await ConfigService.get(key);
	}

	private static toSnakeCase(str: string): string {
		return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
	}
}

class ConfigRestorer {
	static async restoreModuleConfig(moduleConfig: ModuleConfig): Promise<void> {
		for (const [key, configValue] of Object.entries(moduleConfig.configurations)) {
			const { value, type } = configValue;

			if (type === ApplicationCommandOptionType.Role) {
				if (Array.isArray(value)) {
					if (value.length === 1 && value[0]) {
						await ConfigService.setRole(key, value[0]);
					} else if (value.length > 1) {
						await ConfigService.setRoles(key, value);
					}
				}
			} else if (type === ApplicationCommandOptionType.Channel) {
				if (typeof value === 'string') {
					await ConfigService.setChannel(key, value);
				}
			} else {
				if (typeof value === 'string') {
					await ConfigService.set(key, value);
				}
			}
		}
	}
}

export class BackupService {
	private static logger = new Logger("BackupService");
	private static readonly BACKUP_VERSION = 3;

	static async createBackup(client: LeBotClient<true>): Promise<Buffer> {
		this.logger.log("Creating modular configuration backup...");

		const modules: ModuleConfig[] = [];

		for (const [moduleName, moduleData] of client.modules) {
			const configClass = moduleData.options.config;
			if (configClass && (configClass as any).configProperties) {
				const moduleConfig = await ConfigExtractor.extractModuleConfig(
					moduleName,
					configClass
				);
				
				if (Object.keys(moduleConfig.configurations).length > 0) {
					modules.push(moduleConfig);
					this.logger.log(`Backed up ${Object.keys(moduleConfig.configurations).length} configs for ${moduleName}`);
				}
			}
		}

		const backupData: BackupData = {
			timestamp: new Date().toISOString(),
			version: this.BACKUP_VERSION,
			modules,
		};

		const json = JSON.stringify(backupData, null, 2);
		const encrypted = CryptoHelper.encrypt(json);
		this.logger.log(`Backup created with ${modules.length} modules`);
		return Buffer.from(encrypted, "utf-8");
	}

	static async restoreBackup(buffer: Buffer): Promise<void> {
		this.logger.log("Restoring modular configuration backup...");

		try {
			const encrypted = buffer.toString("utf-8");
			const json = CryptoHelper.decrypt(encrypted);
			const backup: BackupData = JSON.parse(json);

			if (backup.version !== this.BACKUP_VERSION) {
				this.logger.warn(
					`Backup version mismatch: expected ${this.BACKUP_VERSION}, got ${backup.version}`
				);
			}

			this.logger.log(`Restoring ${backup.modules.length} modules from ${backup.timestamp}`);

			for (const moduleConfig of backup.modules) {
				this.logger.log(`Restoring ${moduleConfig.moduleName}...`);
				await ConfigRestorer.restoreModuleConfig(moduleConfig);
				this.logger.log(
					`Restored ${Object.keys(moduleConfig.configurations).length} configs for ${moduleConfig.moduleName}`
				);
			}

			this.logger.log("Backup restored successfully.");
		} catch (error) {
			this.logger.error(
				"Failed to restore backup",
				(error as Error)?.stack || String(error)
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
