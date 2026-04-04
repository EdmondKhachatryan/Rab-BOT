import type { GuildMember } from "discord.js";
import { config } from "../config/index.js";

/** Одобрять могут только те, у кого есть хотя бы одна из ролей APPROVER_ROLE_IDS */
export function canReview(member: GuildMember): boolean {
  const allowed = new Set(config.approverRoleIds);
  return member.roles.cache.some((role) => allowed.has(role.id));
}
