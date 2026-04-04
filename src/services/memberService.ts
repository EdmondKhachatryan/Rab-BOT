import type { GuildMember } from "discord.js";
import { config } from "../config/index.js";
import { buildNickname } from "../utils/nickname.js";

type MemberApprovalInput = {
  member: GuildMember;
  rank: string;
  firstName: string;
  lastName: string;
};

export async function applyApprovalChanges(input: MemberApprovalInput): Promise<string> {
  if (config.targetRoleIds.length > 0) {
    await input.member.roles.add(config.targetRoleIds, "Recruitment request approved");
  }

  const nickname = buildNickname(config.nicknamePattern, {
    rank: input.rank,
    firstName: input.firstName,
    lastName: input.lastName
  });
  await input.member.setNickname(nickname, "Recruitment request approved");
  return nickname;
}
