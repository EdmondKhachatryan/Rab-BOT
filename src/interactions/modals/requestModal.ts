import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ModalSubmitInteraction
} from "discord.js";
import { createRoleRequest, setModMessageId } from "../../services/requestService.js";
import { validatePersonField } from "../../utils/nickname.js";
import { config } from "../../config/index.js";

export async function handleRequestModal(interaction: ModalSubmitInteraction): Promise<void> {
  const rank = validatePersonField(interaction.fields.getTextInputValue("rank"), "rank");
  const firstName = validatePersonField(interaction.fields.getTextInputValue("firstName"), "firstName");
  const lastName = validatePersonField(interaction.fields.getTextInputValue("lastName"), "lastName");

  const request = await createRoleRequest({
    guildId: interaction.guildId ?? "",
    userId: interaction.user.id,
    rank,
    firstName,
    lastName
  });

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`review:approve:${request.id}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`review:reject:${request.id}`)
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger)
  );
  const embed = new EmbedBuilder()
    .setTitle("Новая заявка на роль")
    .setDescription(`Заявка ID: \`${request.id}\``)
    .addFields(
      { name: "Пользователь", value: `<@${interaction.user.id}>`, inline: true },
      { name: "Ранг", value: rank, inline: true },
      { name: "ФИО", value: `${firstName} ${lastName}`, inline: false },
      { name: "Статус", value: "pending", inline: true }
    )
    .setTimestamp();

  const modChannel = await interaction.guild?.channels.fetch(config.modChannelId);
  if (!modChannel?.isTextBased()) {
    throw new Error("Moderation channel not found or not text-based");
  }
  const sent = await modChannel.send({ embeds: [embed], components: [row] });
  await setModMessageId(request.id, sent.id);

  await interaction.reply({
    content: "Заявка отправлена рекрутерам на рассмотрение.",
    ephemeral: true
  });
}
