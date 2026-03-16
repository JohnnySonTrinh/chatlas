export const DISPLAY_NAME_LIMIT = 24;
export const BUBBLE_TEXT_LIMIT = 320;
export const BUBBLE_TEXT_COOLDOWN_MS = 5000;
export const MAX_LINK_COUNT = 2;

const BLOCKED_PATTERNS = [
  /\b(fuck|shit|bitch|asshole|wtf)\b/i,
  /\b(casino|escort|buy followers|crypto pump|telegram signal|whatsapp me)\b/i
];

export function validateDisplayName(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "Pick a display name first.";
  }

  if (trimmed.length > DISPLAY_NAME_LIMIT) {
    return `Display names can be up to ${DISPLAY_NAME_LIMIT} characters.`;
  }

  return null;
}

export function validateBubbleText(input: string) {
  const trimmed = input.trim();

  if (!trimmed) {
    return "Write something before posting.";
  }

  if (trimmed.length > BUBBLE_TEXT_LIMIT) {
    return `Bubble text can be up to ${BUBBLE_TEXT_LIMIT} characters.`;
  }

  if (/(.)\1{9,}/u.test(trimmed)) {
    return "That looks a bit spammy. Try a shorter, cleaner message.";
  }

  const linkMatches = trimmed.match(/(?:https?:\/\/|www\.)\S+/gi) ?? [];
  if (linkMatches.length > MAX_LINK_COUNT) {
    return `Please keep it to ${MAX_LINK_COUNT} links or fewer.`;
  }

  if (BLOCKED_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return "That message trips the current safety filter. Try rewriting it.";
  }

  return null;
}
