import type { Guild } from "discord.js";
import { config } from "../config/index.js";

export type AuditEntry = {
  applicantFirstName: string;
  applicantLastName: string;
  acceptMethod: string;
  reviewerDisplayName: string;
};

export async function sendAuditLog(guild: Guild, entry: AuditEntry): Promise<void> {
  const channel = await guild.channels.fetch(config.auditChannelId);
  if (!channel?.isTextBased()) {
    throw new Error("Audit channel not found or not text-based");
  }

  const academyMention = `<@&${config.academyRoleId}>`;
  const body = [
    `**Принят:** ${entry.applicantFirstName} ${entry.applicantLastName}`,
    `**Способ приёма:** ${entry.acceptMethod}`,
    `${academyMention}`,
    `**Одобрил:** ${entry.reviewerDisplayName}`
  ].join("\n");

  await channel.send({
    content: body,
    allowedMentions: { roles: [config.academyRoleId] }
  });
}
