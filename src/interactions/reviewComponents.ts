import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export function disableReviewButtons(requestId: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`review:approve:${requestId}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`review:reject:${requestId}`)
      .setLabel("Reject")
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true)
  );
}
