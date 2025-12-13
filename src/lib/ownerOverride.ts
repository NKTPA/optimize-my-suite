// ============================================================================
// INTERNAL OWNER OVERRIDE
// ============================================================================
// This file contains internal override logic for the platform owner.
// The owner account bypasses all usage limits, subscription requirements,
// and feature locks. This is purely backend logic - NOT exposed in the UI.
// ============================================================================

/**
 * Owner email that receives unlimited access.
 * Change this value to update the owner account.
 */
const OWNER_EMAIL = "nidal.khoury@gmail.com";

/**
 * Check if the given email is the platform owner.
 * Owner accounts bypass all limits and feature restrictions.
 * 
 * @param email - User email to check
 * @returns true if this is the owner account
 */
export function isOwnerEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return email.toLowerCase() === OWNER_EMAIL.toLowerCase();
}

/**
 * Check if the given user ID belongs to the owner account.
 * This is used when we only have the user ID available.
 * Note: This requires the user object to be passed for email check.
 * 
 * @param ownerId - Workspace owner ID
 * @param currentUserId - Current user's ID
 * @param currentUserEmail - Current user's email
 * @returns true if this workspace belongs to the owner
 */
export function isOwnerWorkspace(
  ownerId: string | undefined | null,
  currentUserId: string | undefined | null,
  currentUserEmail: string | undefined | null
): boolean {
  if (!ownerId || !currentUserId || !currentUserEmail) return false;
  // Check if the current user is the owner of this workspace AND is the platform owner
  return ownerId === currentUserId && isOwnerEmail(currentUserEmail);
}
