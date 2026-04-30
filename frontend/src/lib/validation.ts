export type FieldErrors<T extends string = string> = Partial<Record<T, string>>;

export function required(value: string | null | undefined, message: string) {
  return value && value.trim() ? "" : message;
}

export function email(value: string, message = "Введите корректный email.") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? "" : message;
}

export function noLeadingSpace(value: string, message: string) {
  return /^\s/.test(value) ? message : "";
}

export function lengthBetween(value: string, min: number, max: number, message: string) {
  return value.length >= min && value.length <= max ? "" : message;
}

export function maxLength(value: string, max: number, message: string) {
  return value.length <= max ? "" : message;
}

export function matches(value: string, pattern: RegExp, message: string) {
  return pattern.test(value) ? "" : message;
}

export function positiveNumber(value: string, max: number, message: string) {
  const numericValue = Number(value.trim().replace(",", "."));
  return Number.isFinite(numericValue) && numericValue > 0 && numericValue <= max ? "" : message;
}

export function nonNegativeInteger(value: string, message: string) {
  return /^\d+$/.test(value) && Number.parseInt(value, 10) >= 0 ? "" : message;
}

export function allowedFileExtension(file: File | null, extensions: string[], message: string) {
  if (!file) {
    return "";
  }
  const lowerName = file.name.toLowerCase();
  return extensions.some((extension) => lowerName.endsWith(extension)) ? "" : message;
}

export function collectErrors<T extends string>(entries: Array<[T, string]>) {
  return entries.reduce<FieldErrors<T>>((errors, [field, message]) => {
    if (message) {
      errors[field] = message;
    }
    return errors;
  }, {});
}

export function hasErrors(errors: FieldErrors) {
  return Object.keys(errors).length > 0;
}
