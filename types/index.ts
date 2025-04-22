// types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPERADMIN";
  image?: string | null;
  isOnboarded?: boolean;
}

export interface StudentUser extends User {
  role: "STUDENT";
}

export interface TeacherUser extends User {
  role: "TEACHER";
}

export interface AdminUser extends User {
  role: "ADMIN" | "SUPERADMIN";
}
