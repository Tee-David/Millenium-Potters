/**
 * Utility functions for displaying user information
 */

export interface UserDisplayInfo {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  name?: string | null;
}

/**
 * Get user's display name (firstName lastName) with fallback to email
 * @param user - User object with firstName, lastName, and/or email
 * @param fallback - Fallback text if no user info available (default: "Unknown")
 * @returns Display name as "FirstName LastName" or email if names not available
 */
export function getUserDisplayName(
  user: UserDisplayInfo | null | undefined,
  fallback: string = "Unknown"
): string {
  if (!user) return fallback;

  // Check for firstName and lastName
  const firstName = user.firstName?.trim();
  const lastName = user.lastName?.trim();

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  // Check for name property (some objects might have this)
  if (user.name?.trim()) {
    return user.name.trim();
  }

  // Fallback to email
  if (user.email?.trim()) {
    return user.email.trim();
  }

  return fallback;
}

/**
 * Get user's display name with role
 * @param user - User object with firstName, lastName, email, and role
 * @param fallback - Fallback text if no user info available
 * @returns Display name with role
 */
export function getUserDisplayNameWithRole(
  user: (UserDisplayInfo & { role?: string }) | null | undefined,
  fallback: string = "Unknown"
): string {
  const name = getUserDisplayName(user, fallback);

  if (user?.role && name !== fallback) {
    const formattedRole = user.role.replace(/_/g, " ").toLowerCase();
    return `${name} (${formattedRole})`;
  }

  return name;
}
