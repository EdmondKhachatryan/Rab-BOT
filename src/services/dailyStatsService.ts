import type { Client } from "discord.js";
import cron from "node-cron";
import { DateTime } from "luxon";
import { db } from "../db/client.js";
import { config } from "../config/index.js";
import { logger } from "../utils/logger.js";

function getYesterdayRange(tz: string): { start: Date; end: Date; label: string } {
  const todayStart = DateTime.now().setZone(tz).startOf("day");
  const yesterdayStart = todayStart.minus({ days: 1 });
  return {
    start: yesterdayStart.toJSDate(),
    end: todayStart.toJSDate(),
    label: yesterdayStart.toFormat("dd.MM.yyyy")
  };
}

export async function postDailyStats(client: Client): Promise<void> {
  if (!config.dailyStatsChannelId) {
    return;
  }

  const tz = config.dailyStatsTimezone;
  const { start, end, label } = getYesterdayRange(tz);

  const rows = await db.roleRequest.groupBy({
    by: ["reviewedBy"],
    where: {
      guildId: config.guildId,
      status: "approved",
      reviewedAt: { gte: start, lt: end },
      reviewedBy: { not: null }
    },
    _count: { id: true }
  });

  const guild = await client.guilds.fetch(config.guildId);
  const channel = await guild.channels.fetch(config.dailyStatsChannelId);
  if (!channel?.isTextBased()) {
    throw new Error("DAILY_STATS_CHANNEL_ID: канал не найден или не текстовый");
  }

  const sorted = [...rows].sort((a, b) => b._count.id - a._count.id);
  const total = sorted.reduce((s, r) => s + r._count.id, 0);

  let body: string;
  if (sorted.length === 0) {
    body = `📊 **Одобрения за ${label}** (${tz})\nЗа этот день одобрений не было.`;
  } else {
    const lines = sorted.map((r) => {
      const uid = r.reviewedBy!;
      return `• <@${uid}> — **${r._count.id}**`;
    });
    body = [`📊 **Одобрения за ${label}** (${tz})`, "", ...lines, "", `**Всего:** ${total}`].join("\n");
  }

  const userMentions = sorted.map((r) => r.reviewedBy!).filter(Boolean);
  await channel.send({
    content: body,
    allowedMentions: { users: userMentions }
  });

  logger.info({ label, total, recruiters: sorted.length }, "Ежедневная статистика отправлена");
}

export function scheduleDailyStats(client: Client): void {
  if (!config.dailyStatsChannelId) {
    logger.info("DAILY_STATS_CHANNEL_ID пуст — ежедневная статистика отключена");
    return;
  }

  cron.schedule(
    config.dailyStatsCron,
    () => {
      postDailyStats(client).catch((err) => {
        logger.error({ err }, "Не удалось отправить ежедневную статистику");
      });
    },
    { timezone: config.dailyStatsTimezone }
  );
  logger.info(
    {
      cron: config.dailyStatsCron,
      timezone: config.dailyStatsTimezone,
      channel: config.dailyStatsChannelId
    },
    "Планировщик статистики включён"
  );
}
