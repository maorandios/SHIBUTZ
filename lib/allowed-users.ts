export type AllowedUser = {
  /** Israeli ID digits only */
  idNumber: string;
  fullName: string;
};

/** Users allowed to open the shared app. Add more entries as needed. */
export const ALLOWED_USERS: AllowedUser[] = [
  {
    idNumber: "301201101",
    fullName: "דידי מוסאי",
  },
];

export function normalizeIdNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function findAllowedUser(rawId: string): AllowedUser | null {
  const idNumber = normalizeIdNumber(rawId);
  if (!idNumber) return null;
  return (
    ALLOWED_USERS.find((user) => user.idNumber === idNumber) ?? null
  );
}
