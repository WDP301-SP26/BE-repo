export class User {
  id: string; // UUID
  student_id: string;
  email: string;
  password_hash?: string; // Changed from password
  full_name?: string;
  github_username?: string;
  jira_account_id?: string;
  role: string; // STUDENT | GROUP_LEADER | LECTURER | ADMIN
  is_email_verified: boolean;
  avatar_url?: string;
  last_login?: Date;
  created_at: Date; // Changed from createdAt
  updated_at: Date; // Changed from updatedAt
}
