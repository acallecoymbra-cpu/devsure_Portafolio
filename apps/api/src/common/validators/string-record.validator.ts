import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

interface StringRecordLimits {
  maxEntries: number;
  maxKeyLength: number;
  maxValueLength: number;
}

/**
 * Validates a small `Record<string, string>` with no fixed key set (unlike
 * `TranslatableString`, which is keyed by locale) — e.g. `ProjectApp.links`
 * (`{ "Live": "https://...", "Code": "https://..." }`).
 */
export function IsStringRecord(limits: StringRecordLimits, options?: ValidationOptions) {
  return function decorate(object: object, propertyName: string) {
    registerDecorator({
      name: 'isStringRecord',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
          const entries = Object.entries(value as Record<string, unknown>);
          if (entries.length > limits.maxEntries) return false;
          return entries.every(
            ([key, text]) =>
              key.trim().length > 0 &&
              key.length <= limits.maxKeyLength &&
              typeof text === 'string' &&
              text.trim().length > 0 &&
              text.length <= limits.maxValueLength,
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an object of at most ${limits.maxEntries} short string keys mapped to non-empty strings`;
        },
      },
    });
  };
}
