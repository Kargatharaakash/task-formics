export const Role = {
  ADMIN: "ADMIN",
  USER: "USER"
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export const RecurrenceType = {
  NONE: "NONE",
  DAILY: "DAILY",
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY"
} as const;

export type RecurrenceType = (typeof RecurrenceType)[keyof typeof RecurrenceType];

export function isRole(value: string): value is Role {
  return Object.values(Role).includes(value as Role);
}

export function isRecurrenceType(value: string): value is RecurrenceType {
  return Object.values(RecurrenceType).includes(value as RecurrenceType);
}
