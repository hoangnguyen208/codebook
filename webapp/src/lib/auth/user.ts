export function getUserInitials(nameOrEmail?: string | null) {
  if (!nameOrEmail) {
    return "U";
  }

  const cleaned = nameOrEmail.trim();
  if (!cleaned) {
    return "U";
  }

  const words = cleaned
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  const firstWord = words[0] ?? cleaned;
  const withoutDomain = firstWord.split("@")[0] ?? firstWord;
  return withoutDomain.slice(0, 2).toUpperCase();
}

export function getDisplayName(name?: string | null, email?: string | null) {
  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  const trimmedEmail = email?.trim();
  if (trimmedEmail) {
    return trimmedEmail;
  }

  return "User";
}
