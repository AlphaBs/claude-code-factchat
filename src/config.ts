import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export type ConfigFile = {
    apiKey?: string;
    host?: string;
    port?: number;
}

// 설정 파일 경로
const CONFIG_PATH = join(homedir(), '.config', 'fchat-claude', 'config.json');

// 로그 파일 경로
export const LOG_PATH = join(homedir(), '.config', 'fchat-claude', 'proxy.log');

export function loadConfig(): ConfigFile {
    if (existsSync(CONFIG_PATH)) {
        try {
            const configData = readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(configData);
        } catch (error) {
            console.warn(`Failed to parse config file ${CONFIG_PATH}:`, error);
        }
    }
    return {};
}

export function getConfigPath(): string | null {
    return existsSync(CONFIG_PATH) ? CONFIG_PATH : null;
}

export function saveConfig(config: ConfigFile): void {
    // 설정 디렉토리 생성
    const configDir = join(homedir(), ".config", "fchat-claude");
    mkdirSync(configDir, { recursive: true });

    // 설정 파일 저장
    writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}