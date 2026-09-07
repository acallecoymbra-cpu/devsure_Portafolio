import { SUPPORTED_LOCALES } from '@devsure/contracts';
import { ValidationArguments, ValidationOptions, registerDecorator } from 'class-validator';

const SUPPORTED_LOCALE_SET: ReadonlySet<string> = new Set(SUPPORTED_LOCALES);

/**
 * Validates a `TranslatableString`: a plain object keyed by a supported
 * locale, each value a trimmed non-empty string up to `maxLength`.
 */
export function IsTranslatableString(maxLength: number, options?: ValidationOptions) {
  return function decorate(object: object, propertyName: string) {
    registerDecorator({
      name: 'isTranslatableString',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
          const entries = Object.entries(value as Record<string, unknown>);
          return entries.every(
            ([locale, text]) =>
              SUPPORTED_LOCALE_SET.has(locale) &&
              typeof text === 'string' &&
              text.trim().length > 0 &&
              text.length <= (args.constraints[0] as number),
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must map supported locales to non-empty strings of at most ${maxLength} characters`;
        },
      },
      constraints: [maxLength],
    });
  };
}
