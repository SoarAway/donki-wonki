  export type ValidationMessage = string;

  /**
   * Returns `true` when at least one field has a non-empty validation message.
   *
   * @param errors Object map of field names to validation messages.
   */
  export const hasValidationErrors = <T extends Record<string, ValidationMessage>>(errors: T) =>
    Object.values(errors).some(Boolean);

  /**
   * Picks the first non-empty validation message from the provided list.
   *
   * @param messages Candidate validation messages in priority order.
   */
  export const firstValidationError = (
    ...messages: Array<ValidationMessage | undefined>
  ): ValidationMessage => messages.find(message => Boolean(message && message.length > 0)) ?? '';

  /**
   * Validates that a field has non-whitespace content. 
   *
   * @param value Raw field value.
   * @param message Error message to return when invalid.
   */
  export const requireValue = (value: string, message: ValidationMessage): ValidationMessage =>
    value.trim().length > 0 ? '' : message;

/**
 * Validates that a value looks like an email address. (Email field)
 *
 * @param value Raw field value.
 * @param message Error message to return when invalid.
 */
export const validateEmail = (value: string, message: ValidationMessage): ValidationMessage => {
  const normalized = value.trim();
  if (normalized.length === 0) {
    return message;
  }

  return normalized.includes('@') ? '' : message;
};

/**
 * Validates that a string meets a minimum length. (Password)
 *
 * @param value Raw field value.
 * @param min Minimum character count.
 * @param message Error message to return when invalid.
 */
export const minLength = (
  value: string,
  min: number,
  message: ValidationMessage,
): ValidationMessage => (value.trim().length >= min ? '' : message);

/**
 * Validates that two values are equal.
 *
 * @param value Value to validate.
 * @param compareWith Value to compare against.
 * @param message Error message to return when values differ.
 */
export const matchValue = (
  value: string,
  compareWith: string,
  message: ValidationMessage,
): ValidationMessage => (value === compareWith ? '' : message);
