import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { canReview } from "../../services/permissionService.js";
import { getRoleRequest, markRejected } from "../../services/requestService.js";
import { disableReviewButtons } from "../reviewComponents.js";
import { buildApproveModal } from "../modals/approveModal.js";

export async function handleReviewButton(interaction: ButtonInteraction): Promise<void> {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({ content: "Только на сервере.", ephemeral: true });
    return;
  }

  const reviewer = await interaction.guild.members.fetch(interaction.user.id);
  if (!canReview(reviewer)) {
    await interaction.reply({
      content: "Нет прав на модерацию (нужна одна из рекрутерских ролей).",
      ephemeral: true
    });
    return;
  }

  const [, action, requestId] = interaction.customId.split(":");
  if (!requestId || (action !== "approve" && action !== "reject")) {
    await interaction.reply({ content: "Некорректная кнопка.", ephemeral: true });
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

  if (action === "approve") {
    await interaction.showModal(buildApproveModal(requestId));
    return;
  }

  const updated = await markRejected(request.id, interaction.user.id);
  await interaction.update({
    embeds: [
      new EmbedBuilder()
        .setTitle("Заявка на роль")
        .setDescription(`Заявка ID: \`${updated.id}\``)
        .addFields(
          { name: "Пользователь", value: `<@${updated.userId}>`, inline: true },
          { name: "Ранг", value: updated.rank, inline: true },
          { name: "ФИО", value: `${updated.firstName} ${updated.lastName}`, inline: false },
          { name: "Статус", value: "rejected", inline: true },
          { name: "Рассмотрел", value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp()
    ],
    components: [disableReviewButtons(request.id)]
  });
}
