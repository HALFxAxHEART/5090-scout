export type UserRole = "admin" | "scout";

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}
