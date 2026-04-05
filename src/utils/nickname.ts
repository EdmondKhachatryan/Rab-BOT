const DISCORD_NICKNAME_MAX = 32;
const SAFE_PART = /^[\p{L}\p{N}\s-]+$/u;

export type NicknameInput = {
  rank: string;
  firstName: string;
  lastName: string;
};

/** Ранг: только цифры (например 1, 2, 10) — 1–10 символов */
export function validateRankField(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length < 1 || trimmed.length > 10) {
    throw new Error("Ранг: от 1 до 10 цифр.");
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Ранг: только цифры, без букв и пробелов.");
  }
  return trimmed;
}

const PERSON_LABEL: Record<string, string> = {
  firstName: "Имя",
  lastName: "Фамилия"
};

export function validatePersonField(value: string, fieldName: string): string {
  const trimmed = value.trim();
  const label = PERSON_LABEL[fieldName] ?? fieldName;
  if (trimmed.length < 1 || trimmed.length > 20) {
    throw new Error(`${label}: от 1 до 20 символов.`);
  }
  if (!SAFE_PART.test(trimmed)) {
    throw new Error(`${label}: недопустимые символы (буквы, цифры, пробел, дефис).`);
  }
  return trimmed;
}

export function buildNickname(pattern: string, input: NicknameInput): string {
  const nickname = pattern
    .replace("{rank}", input.rank.trim())
    .replace("{firstName}", input.firstName.trim())
    .replace("{lastName}", input.lastName.trim());

  if (nickname.length > DISCORD_NICKNAME_MAX) {
    throw new Error(`Ник слишком длинный (макс. ${DISCORD_NICKNAME_MAX} символов в Discord).`);
  }

  return nickname;
}
