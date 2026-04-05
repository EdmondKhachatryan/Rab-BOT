import {
  ActionRowBuilder,
  EmbedBuilder,
  ModalBuilder,
  ModalSubmitInteraction,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { config } from "../../config/index.js";
import { canReview } from "../../services/permissionService.js";
import { getRoleRequest, markApproved } from "../../services/requestService.js";
import { applyApprovalChanges } from "../../services/memberService.js";
import { sendAuditLog } from "../../services/auditService.js";
import { disableReviewButtons } from "../reviewComponents.js";

export function buildApproveModal(requestId: string): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId(`approve-confirm:${requestId}`)
    .setTitle("Одобрение заявки");

  const methodInput = new TextInputBuilder()
    .setCustomId("acceptMethod")
    .setLabel("Способ: титул, звонок, собеседование")
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(500);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(methodInput));
  return modal;
}

function validateAcceptMethod(raw: string): string {
  const v = raw.trim();
  if (v.length < 2 || v.length > 500) {
    throw new Error("Укажите способ приёма (2–500 символов).");
  }
  return v;
}

export async function handleApproveModal(interaction: ModalSubmitInteraction): Promise<void> {
  const requestId = interaction.customId.replace("approve-confirm:", "");
  if (!requestId) {
    await interaction.reply({ content: "Некорректная заявка.", ephemeral: true });
    return;
  }

  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: "Доступно только на сервере.", ephemeral: true });
    return;
  }

  const reviewer = await interaction.guild.members.fetch(interaction.user.id);
  if (!canReview(reviewer)) {
    await interaction.reply({
      content: "У вас нет прав (нужна одна из рекрутерских ролей).",
      ephemeral: true
    });
    return;
  }

  const request = await getRoleRequest(requestId);
  if (!request) {
    await interaction.reply({ content: "Заявка не найдена.", ephemeral: true });
    return;
  }

  if (request.status !== "pending") {
    await interaction.reply({ content: `Заявка уже обработана: ${request.status}.`, ephemeral: true });
    return;
  }

  let acceptMethod: string;
  try {
    acceptMethod = validateAcceptMethod(interaction.fields.getTextInputValue("acceptMethod"));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Некорректные данные.";
    await interaction.reply({ content: msg, ephemeral: true });
    return;
  }

  /* Discord даёт ~3 с на первый ответ; выдача ролей и ник дольше — сначала defer */
  await interaction.deferReply({ ephemeral: true });

  const member = await interaction.guild.members.fetch(request.userId);
  let nickname: string;
  try {
    nickname = await applyApprovalChanges({
      member,
      rank: request.rank,
      firstName: request.firstName,
      lastName: request.lastName
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Ошибка при выдаче ролей или смене ника.";
    await interaction.editReply({ content: msg });
    return;
  }

  const updated = await markApproved(request.id, interaction.user.id);

  try {
    await sendAuditLog(interaction.guild, {
      applicantFirstName: request.firstName,
      applicantLastName: request.lastName,
      acceptMethod,
      reviewerDisplayName: reviewer.displayName
    });
  } catch (err) {
    const { logger } = await import("../../utils/logger.js");
    logger.error({ err }, "Audit log failed");
  }

  const approvedEmbed = new EmbedBuilder()
    .setTitle("Заявка на роль")
    .setDescription(`Заявка ID: \`${updated.id}\``)
    .addFields(
      { name: "Пользователь", value: `<@${updated.userId}>`, inline: true },
      { name: "Ранг", value: updated.rank, inline: true },
      { name: "ФИО", value: `${updated.firstName} ${updated.lastName}`, inline: false },
      { name: "Способ приёма", value: acceptMethod, inline: false },
      { name: "Новый ник", value: nickname, inline: false },
      { name: "Статус", value: "approved", inline: true },
      { name: "Рассмотрел", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setTimestamp();

  if (request.modMessageId) {
    const modChannel = await interaction.guild.channels.fetch(config.modChannelId);
    if (modChannel?.isTextBased()) {
      try {
        const msg = await modChannel.messages.fetch(request.modMessageId);
        await msg.edit({ embeds: [approvedEmbed], components: [disableReviewButtons(request.id)] });
      } catch {
        /* сообщение удалили */
      }
    }
  }

  await interaction.editReply({ content: "Заявка одобрена, запись в аудит отправлена." });
}
