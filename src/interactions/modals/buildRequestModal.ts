import {
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";

export function buildRequestRoleModal(): ModalBuilder {
  const modal = new ModalBuilder()
    .setCustomId("request-role-modal")
    .setTitle("Заявка на роль");

  /* В Discord нет read-only: показываем «1», на сервере всегда подставляем 1, ввод не учитываем */
  const rankInput = new TextInputBuilder()
    .setCustomId("rank")
    .setLabel("Ранг (не меняйте — всегда 1)")
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(1)
    .setValue("1");

  const firstNameInput = new TextInputBuilder()
    .setCustomId("firstName")
    .setLabel("Имя")
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(20);

  const lastNameInput = new TextInputBuilder()
    .setCustomId("lastName")
    .setLabel("Фамилия")
    .setRequired(true)
    .setStyle(TextInputStyle.Short)
    .setMinLength(1)
    .setMaxLength(20);

  modal.addComponents(
    new ActionRowBuilder<TextInputBuilder>().addComponents(rankInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(firstNameInput),
    new ActionRowBuilder<TextInputBuilder>().addComponents(lastNameInput)
  );

  return modal;
}
