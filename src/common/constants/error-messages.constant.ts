export const ERROR_MESSAGES = {
  AUTH: {
    EMAIL_ALREADY_EXISTS: 'This email is already in use',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_NOT_LINKED: 'This account is not linked to the specified provider',
    INVALID_TOKEN_PAYLOAD: 'Invalid token payload',
    USER_NOT_FOUND: 'User not found',
    GITHUB_NOT_CONFIGURED: 'GitHub OAuth is not configured',
    GITHUB_TOKEN_EXCHANGE_FAILED: 'Failed to exchange code for token',
    GITHUB_OAUTH_FAILED: 'GitHub OAuth failed. Please try again.',
    INVALID_REDIRECT_URI: 'Invalid or missing redirect_uri',
    MISSING_PARAMETER: 'Missing required parameter',
    INVALID_OAUTH_STATE: 'Invalid or expired OAuth state',
    INVALID_PROVIDER: 'Invalid provider',
    JIRA_REQUIRES_HTTPS:
      'Jira OAuth requires HTTPS. Please configure domain + SSL first.',
  },
  GROUPS: {
    NOT_FOUND: 'Group not found',
    NOT_A_MEMBER: 'You are not a member of this group',
    USER_NOT_FOUND: 'User not found',
    ALREADY_A_MEMBER: 'User is already a member of this group',
    MEMBER_NOT_FOUND: 'Member not found in this group',
    CANNOT_REMOVE_LAST_LEADER:
      'Cannot remove the last leader. Assign another leader first.',
    CANNOT_LEAVE_AS_LAST_LEADER:
      'You are the last leader. Assign another leader before leaving.',
    ONLY_LEADERS_CAN_MANAGE: 'Only group leaders can perform this action',
  },
  VALIDATION: {
    INVALID_EMAIL: 'Invalid email format',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters',
    FULL_NAME_REQUIRED: 'Full name is required',
  },
} as const;

export const SUCCESS_MESSAGES = {
  AUTH: {
    ACCOUNT_UNLINKED: 'Account unlinked successfully',
    LOGGED_OUT: 'Logged out successfully',
  },
} as const;
