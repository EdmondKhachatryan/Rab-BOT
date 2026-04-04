const DISCORD_NICKNAME_MAX = 32;
const SAFE_PART = /^[\p{L}\p{N}\s-]+$/u;

export type NicknameInput = {
  rank: string;
  firstName: string;
  lastName: string;
};

export function validatePersonField(value: string, fieldName: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    throw new Error(`${fieldName} must be 2-20 chars`);
  }
  if (!SAFE_PART.test(trimmed)) {
    throw new Error(`${fieldName} has invalid characters`);
  }
  return trimmed;
}

export function buildNickname(pattern: string, input: NicknameInput): string {
  const nickname = pattern
    .replace("{rank}", input.rank.trim())
    .replace("{firstName}", input.firstName.trim())
    .replace("{lastName}", input.lastName.trim());

  if (nickname.length > DISCORD_NICKNAME_MAX) {
    throw new Error(`Nickname is too long (max ${DISCORD_NICKNAME_MAX})`);
  }

  return nickname;
}
