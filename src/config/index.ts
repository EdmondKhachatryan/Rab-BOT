import dotenv from "dotenv";
import { existsSync } from "fs";
import { resolve } from "path";
import { z } from "zod";

const root = process.cwd();
const envPath = resolve(root, ".env");
const envExamplePath = resolve(root, ".env.example");

if (existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
if (!process.env.DISCORD_TOKEN?.trim()) {
  if (existsSync(envExamplePath)) {
    dotenv.config({ path: envExamplePath, override: true });
    console.warn(
      "[config] Нет переменных в .env — используется .env.example. Скопируй .env.example в .env и храни токен только в .env"
    );
  }
}

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  CLIENT_ID: z.string().min(1),
  GUILD_ID: z.string().min(1),
  PANEL_CHANNEL_ID: z.string().min(1),
  MOD_CHANNEL_ID: z.string().min(1),
  APPROVER_ROLE_IDS: z.string().min(1),
  TARGET_ROLE_IDS: z.string().min(1),
  AUDIT_CHANNEL_ID: z.string().min(1),
  ACADEMY_ROLE_ID: z.string().min(1),
  DAILY_STATS_CHANNEL_ID: z.string().default(""),
  DAILY_STATS_CRON: z.string().default("0 9 * * *"),
  DAILY_STATS_TIMEZONE: z.string().default("Europe/Moscow"),
  NICKNAME_PATTERN: z.string().default("[{rank}] {firstName} {lastName}"),
  LOG_LEVEL: z.string().default("info"),
  /** JSON-логи в файл (для админов / регламент п. 7.3), параллельно pretty в консоль */
  LOG_TO_FILE: z.string().default("false"),
  LOG_FILE_PATH: z.string().default("logs/chopbot.log")
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const message = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
  throw new Error(
    `Неверный .env: ${message}\n` +
      `Создай файл .env в корне проекта (рядом с package.json): скопируй .env.example → .env и заполни значения.`
  );
}

const env = parsed.data;

function parseIdList(raw: string): string[] {
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export const config = {
  token: env.DISCORD_TOKEN,
  clientId: env.CLIENT_ID,
  guildId: env.GUILD_ID,
  panelChannelId: env.PANEL_CHANNEL_ID,
  modChannelId: env.MOD_CHANNEL_ID,
  approverRoleIds: parseIdList(env.APPROVER_ROLE_IDS),
  targetRoleIds: parseIdList(env.TARGET_ROLE_IDS),
  auditChannelId: env.AUDIT_CHANNEL_ID,
  academyRoleId: env.ACADEMY_ROLE_ID,
  dailyStatsChannelId: env.DAILY_STATS_CHANNEL_ID.trim() || undefined,
  dailyStatsCron: env.DAILY_STATS_CRON,
  dailyStatsTimezone: env.DAILY_STATS_TIMEZONE,
  nicknamePattern: env.NICKNAME_PATTERN,
  logLevel: env.LOG_LEVEL,
  logToFile: env.LOG_TO_FILE.toLowerCase() === "true",
  logFilePath: env.LOG_FILE_PATH
};
