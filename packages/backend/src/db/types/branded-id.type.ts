/**
 * Branded ID Type for MikroORM
 *
 * Generic custom type for handling TypeScript branded string IDs.
 * Converts branded IDs to/from database text columns while preserving
 * type safety at the TypeScript level.
 *
 * Usage:
 * ```typescript
 * export class UserIdType extends BrandedIdType<UserId> {
 *   override get name(): string { return "UserId"; }
 * }
 *
 * @Entity()
 * export class User {
 *   @PrimaryKey({ type: UserIdType })
 *   id: UserId = createEntityId<UserId>(crypto.randomUUID());
 * }
 * ```
 */

import { Type, type Platform, type EntityProperty } from "@mikro-orm/core";

/**
 * Generic branded ID type for MikroORM.
 *
 * Converts branded string IDs to/from database strings.
 * The branded type ensures type safety at compile time while
 * the database stores plain text values.
 *
 * @typeParam T - The branded ID type (e.g., WidgetId, UserId)
 */
export abstract class BrandedIdType<T extends string & { readonly __brand: string }> extends Type<
  T,
  string
> {
  override convertToDatabaseValue(
    value: T | string | undefined | null,
    _platform: Platform
  ): string {
    if (value === undefined || value === null) {
      return value as unknown as string;
    }
    return value as string;
  }

  override convertToJSValue(value: string | undefined | null, _platform: Platform): T {
    if (value === undefined || value === null) {
      return value as unknown as T;
    }
    return value as T;
  }

  override getColumnType(_prop: EntityProperty, _platform: Platform): string {
    return "text";
  }

  override compareAsType(): string {
    return "string";
  }

  abstract override get name(): string;
}
