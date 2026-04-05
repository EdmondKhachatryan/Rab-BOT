import type { GuildMember } from "discord.js";
import { config } from "../config/index.js";
import { buildNickname } from "../utils/nickname.js";
import { logger } from "../utils/logger.js";

type MemberApprovalInput = {
  member: GuildMember;
  rank: string;
  firstName: string;
  lastName: string;
};

const APPROVAL_REASON = "Recruitment request approved";

/** ID роли @everyone совпадает с GUILD_ID — её нельзя указывать в TARGET_ROLE_IDS */
function filterEveryoneRoleId(guildId: string, ids: string[]): string[] {
  const filtered = ids.filter((id) => id.trim() !== "" && id !== guildId);
  const skipped = ids.length - filtered.length;
  if (skipped > 0) {
    logger.warn(
      { guildId, skipped },
      "Из TARGET_ROLE_IDS убран GUILD_ID (@everyone) — его нельзя выдавать как роль"
    );
  }
  return filtered;
}

/** Оставляет только роли, которые бот реально может выдать (иерархия, не managed). */
function filterRolesBotCanAssign(
  guildId: string,
  botMember: GuildMember,
  roleIds: string[],
  guild: GuildMember["guild"]
): string[] {
  const botHighest = botMember.roles.highest;
  const assignable: string[] = [];

  for (const roleId of roleIds) {
    const role = guild.roles.cache.get(roleId);
    if (!role) {
      logger.warn({ roleId }, "Роль не найдена на сервере — проверь TARGET_ROLE_IDS");
      continue;
    }
    if (role.id === guildId) continue;
    if (role.managed) {
      logger.warn(
        { roleId, roleName: role.name },
        "Роль managed (интеграция/буст) — бот не может выдать"
      );
      continue;
    }
    if (botHighest.comparePositionTo(role) <= 0) {
      logger.warn(
        { roleId, roleName: role.name, botTopRole: botHighest.name },
        "Роль выше верхней роли бота — в «Роли» сервера перетащи роль бота ВЫШЕ этой роли"
      );
      continue;
    }
    assignable.push(roleId);
  }

  return assignable;
}

export async function applyApprovalChanges(input: MemberApprovalInput): Promise<string> {
  const { guild } = input.member;
  const botMember = guild.members.me ?? (await guild.members.fetchMe());
  if (!botMember) {
    throw new Error("Бот не видит себя на сервере (участник бота не загружен).");
  }

  await guild.roles.fetch().catch(() => undefined);

  const afterEveryone = filterEveryoneRoleId(guild.id, config.targetRoleIds);
  const roleIds = filterRolesBotCanAssign(guild.id, botMember, afterEveryone, guild);

  if (afterEveryone.length > 0 && roleIds.length === 0) {
    const botTop = botMember.roles.highest.name;
    throw new Error(
      "Роли не выданы: верхняя роль бота («" +
        botTop +
        "») в списке ролей сервера стоит НИЖЕ, чем роли из TARGET_ROLE_IDS. " +
        "Открой Настройки сервера → Роли и перетащи роль бота выше каждой роли, которую он должен выдавать (чем выше в списке, тем сильнее роль)."
    );
  }

  if (roleIds.length < afterEveryone.length) {
    logger.warn(
      { wanted: afterEveryone.length, assigned: roleIds.length },
      "Выданы не все роли из TARGET_ROLE_IDS — см. предупреждения выше"
    );
  }

  for (const roleId of roleIds) {
    await input.member.roles.add(roleId, APPROVAL_REASON);
  }

  const nickname = buildNickname(config.nicknamePattern, {
    rank: input.rank,
    firstName: input.firstName,
    lastName: input.lastName
  });

  try {
    await input.member.setNickname(nickname, APPROVAL_REASON);
  } catch (e) {
    logger.error({ err: e }, "Не удалось сменить ник (владелец сервера или нет права «Управление никнеймами»)");
    throw new Error(
      "Роли выданы, но ник не изменён: у бота должно быть право «Управление никнеймами», а для владельца сервера ник ботом не меняется."
    );
  }

  return nickname;
}
