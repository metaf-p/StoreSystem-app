export function buildControlId({
  explicitId,
  name,
  fallbackId,
}: {
  explicitId?: string;
  name?: string;
  fallbackId: string;
}) {
  const trimmedId = explicitId?.trim();
  if (trimmedId) {
    return trimmedId;
  }

  const trimmedName = name?.trim();
  if (trimmedName) {
    return trimmedName;
  }

  return fallbackId;
}
