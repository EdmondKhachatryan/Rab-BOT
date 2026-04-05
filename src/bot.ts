import { Client, GatewayIntentBits, Interaction, REST, Routes } from "discord.js";
import { config } from "./config/index.js";
import { logger } from "./utils/logger.js";
import { buildRequestRoleModal } from "./interactions/modals/buildRequestModal.js";
import { handleRequestModal } from "./interactions/modals/requestModal.js";
import { handleApproveModal } from "./interactions/modals/approveModal.js";
import { handleReviewButton } from "./interactions/buttons/reviewButtons.js";
import { ensureRequestPanel } from "./services/panelService.js";
import { scheduleDailyStats } from "./services/dailyStatsService.js";
import { db } from "./db/client.js";

async function clearGuildSlashCommands(): Promise<void> {
  try {
    const rest = new REST({ version: "10" }).setToken(config.token);
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
      body: []
    });
    logger.info("Слеш-команды на сервере очищены (заявки через кнопку).");
  } catch (err) {
    logger.warn(
      { err },
      "Не удалось очистить slash-команды (часто 50001 Missing Access: проверь GUILD_ID, что бот на этом сервере, в invite есть bot + applications.commands). Бот всё равно запускается."
    );
  }
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", async () => {
  logger.info({ bot: client.user?.tag }, "Bot is ready");
  try {
    await ensureRequestPanel(client);
  } catch (error) {
    logger.error({ err: error }, "Панель с кнопкой не создана");
  }
  scheduleDailyStats(client);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  try {
    if (interaction.isButton() && interaction.customId === "request-open") {
      await interaction.showModal(buildRequestRoleModal());
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId === "request-role-modal") {
      await handleRequestModal(interaction);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("approve-confirm:")) {
      await handleApproveModal(interaction);
      return;
    }

    if (interaction.isButton() && interaction.customId.startsWith("review:")) {
      await handleReviewButton(interaction);
      return;
    }
  } catch (error) {
    logger.error({ err: error }, "Interaction handler failed");
    const content = "Произошла ошибка при обработке действия.";
    if (interaction.isRepliable()) {
      try {
        if (interaction.deferred) {
          await interaction.editReply({ content });
        } else if (interaction.replied) {
          await interaction.followUp({ content, ephemeral: true });
        } else {
          await interaction.reply({ content, ephemeral: true });
        }
      } catch {
        /* 10062 Unknown interaction — ответ уже невозможен */
      }
    }
  }
});

async function start(): Promise<void> {
  await clearGuildSlashCommands();
  await db.$connect();
  await client.login(config.token);
}

start().catch((error) => {
  logger.error({ err: error }, "Failed to start bot");
  process.exit(1);
});
