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

/** Ранг в форме только для вида; Discord не умеет read-only — на сервере всегда 1 */
const FIXED_RANK = "1";

export async function handleRequestModal(interaction: ModalSubmitInteraction): Promise<void> {
  let firstName: string;
  let lastName: string;
  try {
    firstName = validatePersonField(interaction.fields.getTextInputValue("firstName"), "firstName");
    lastName = validatePersonField(interaction.fields.getTextInputValue("lastName"), "lastName");
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Проверь поля формы.";
    await interaction.reply({ content: msg, ephemeral: true });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const request = await createRoleRequest({
    guildId: interaction.guildId ?? "",
    userId: interaction.user.id,
    rank: FIXED_RANK,
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
      { name: "Ранг", value: FIXED_RANK, inline: true },
      { name: "ФИО", value: `${firstName} ${lastName}`, inline: false },
      { name: "Статус", value: "pending", inline: true }
    )
    .setTimestamp();

  const modChannel = await interaction.guild?.channels.fetch(config.modChannelId);
  if (!modChannel?.isTextBased()) {
    await interaction.editReply({
      content: "Канал модерации не найден или не текстовый — проверь MOD_CHANNEL_ID."
    });
    return;
  }
  const sent = await modChannel.send({ embeds: [embed], components: [row] });
  await setModMessageId(request.id, sent.id);

  await interaction.editReply({ content: "Заявка отправлена рекрутерам на рассмотрение." });
}
