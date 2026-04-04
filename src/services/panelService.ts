import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder
} from "discord.js";
import { config } from "../config/index.js";
import { db } from "../db/client.js";
import { logger } from "../utils/logger.js";

const PANEL_BUTTON_ID = "request-open";

export async function ensureRequestPanel(client: Client): Promise<void> {
  const guild = await client.guilds.fetch(config.guildId);
  const channel = await guild.channels.fetch(config.panelChannelId);
  if (!channel?.isTextBased()) {
    throw new Error("PANEL_CHANNEL_ID: канал не найден или не текстовый");
  }

  let settings = await db.botSettings.findUnique({ where: { id: 1 } });
  if (!settings) {
    settings = await db.botSettings.create({ data: { id: 1 } });
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(PANEL_BUTTON_ID)
      .setLabel("Подать заявку")
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setTitle("Заявка на роль")
    .setDescription("Нажмите кнопку ниже, чтобы открыть форму (ранг, имя, фамилия).");

  if (settings.panelMessageId) {
    try {
      const msg = await channel.messages.fetch(settings.panelMessageId);
      await msg.edit({ embeds: [embed], components: [row] });
      logger.info({ messageId: settings.panelMessageId }, "Панель заявок обновлена");
      return;
    } catch {
      logger.warn("Старое сообщение панели не найдено — создаю новое");
    }
  }

  const sent = await channel.send({ embeds: [embed], components: [row] });
  await db.botSettings.update({
    where: { id: 1 },
    data: { panelMessageId: sent.id }
  });
  logger.info({ messageId: sent.id }, "Панель заявок создана");
}
