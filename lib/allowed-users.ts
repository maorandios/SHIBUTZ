export type AllowedUser = {
  /** Israeli mobile digits only, e.g. 0528501370 */
  phoneNumber: string;
  fullName: string;
};

/** Users allowed to open the shared app. */
export const ALLOWED_USERS: AllowedUser[] = [
  { phoneNumber: "0528501370", fullName: "איתי נגר" },
  { phoneNumber: "0503029696", fullName: "מאור סבג" },
  { phoneNumber: "0506722449", fullName: "ליאת טל" },
  { phoneNumber: "0542232458", fullName: "מקסים סלוצקי" },
  { phoneNumber: "0544551426", fullName: "ידידה מוסאי" },
];

export function normalizePhoneNumber(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("972") && digits.length >= 11) {
    digits = `0${digits.slice(3)}`;
  }
  return digits;
}

export function findAllowedUser(rawPhone: string): AllowedUser | null {
  const phoneNumber = normalizePhoneNumber(rawPhone);
  if (phoneNumber.length < 9) return null;
  return (
    ALLOWED_USERS.find((user) => user.phoneNumber === phoneNumber) ?? null
  );
}
