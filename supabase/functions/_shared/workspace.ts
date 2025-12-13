// Shared workspace helper for all edge functions
// Ensures a workspace always exists for authenticated users

// Using 'any' for SupabaseClient to avoid version mismatch issues across functions

interface WorkspaceData {
  id: string;
  plan: string;
  subscription_status: string | null;
  trial_ends_at: string | null;
  owner_id: string;
}

interface WorkspaceResult {
  workspace: WorkspaceData;
  isOwner: boolean;
}

interface WorkspaceError {
  error: string;
  status: number;
}

/**
 * Get or create a workspace for an authenticated user.
 * This helper ensures that no edge function ever returns "Workspace not found" for a valid user.
 * 
 * Logic:
 * 1. Try to find a workspace where the user is the owner
 * 2. If not found, try to find a workspace where the user is a member
 * 3. If still not found, create a new workspace for the user
 * 
 * @param supabaseAdmin - Supabase client with service role key
 * @param userId - The authenticated user's ID
 * @param userEmail - The authenticated user's email (for logging)
 * @returns WorkspaceResult with workspace data and owner status, or WorkspaceError
 */
export async function getOrCreateWorkspaceForUser(
  supabaseAdmin: any,
  userId: string,
  userEmail?: string
): Promise<WorkspaceResult | WorkspaceError> {
  const logPrefix = `[workspace-helper]`;
  console.log(`${logPrefix} Getting workspace for user:`, userId, userEmail || "");

  try {
    // Step 1: Use the database function to get workspace ID (handles owner OR member)
    const { data: workspaceId, error: rpcError } = await supabaseAdmin
      .rpc("get_user_workspace_id", { _user_id: userId });

    if (!rpcError && workspaceId) {
      // Found a workspace, fetch full data
      const { data: workspace, error: wsError } = await supabaseAdmin
        .from("workspaces")
        .select("id, plan, subscription_status, trial_ends_at, owner_id")
        .eq("id", workspaceId)
        .single();

      if (!wsError && workspace) {
        const isOwner = workspace.owner_id === userId;
        console.log(`${logPrefix} Found existing workspace:`, workspace.id, "isOwner:", isOwner);
        return {
          workspace: workspace as WorkspaceData,
          isOwner,
        };
      }
    }

    // Step 2: No workspace found via RPC, try direct queries
    console.log(`${logPrefix} RPC returned no workspace, trying direct queries`);

    // Try owner lookup
    const { data: ownedWorkspace, error: ownedError } = await supabaseAdmin
      .from("workspaces")
      .select("id, plan, subscription_status, trial_ends_at, owner_id")
      .eq("owner_id", userId)
      .maybeSingle();

    if (!ownedError && ownedWorkspace) {
      console.log(`${logPrefix} Found owned workspace:`, ownedWorkspace.id);
      return {
        workspace: ownedWorkspace as WorkspaceData,
        isOwner: true,
      };
    }

    // Try member lookup
    const { data: membership, error: memberError } = await supabaseAdmin
      .from("workspace_members")
      .select("workspace_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!memberError && membership) {
      const { data: memberWorkspace, error: wsError } = await supabaseAdmin
        .from("workspaces")
        .select("id, plan, subscription_status, trial_ends_at, owner_id")
        .eq("id", membership.workspace_id)
        .single();

      if (!wsError && memberWorkspace) {
        console.log(`${logPrefix} Found member workspace:`, memberWorkspace.id);
        return {
          workspace: memberWorkspace as WorkspaceData,
          isOwner: false,
        };
      }
    }

    // Step 3: No workspace exists - create one for this user
    console.log(`${logPrefix} No workspace found, creating new workspace for user:`, userId);

    // Get user's profile for workspace name
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("agency_name, first_name")
      .eq("user_id", userId)
      .maybeSingle();

    const workspaceName = profile?.agency_name || 
                          (profile?.first_name ? `${profile.first_name}'s Workspace` : "My Workspace");

    // Create the workspace
    const { data: newWorkspace, error: createError } = await supabaseAdmin
      .from("workspaces")
      .insert({
        name: workspaceName,
        owner_id: userId,
        plan: "starter",
        subscription_status: "trialing",
        trial_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days trial
      })
      .select("id, plan, subscription_status, trial_ends_at, owner_id")
      .single();

    if (createError || !newWorkspace) {
      console.error(`${logPrefix} Failed to create workspace:`, createError?.message);
      return {
        error: "Failed to create workspace. Please try again.",
        status: 500,
      };
    }

    console.log(`${logPrefix} Created new workspace:`, newWorkspace.id);

    // Create workspace_usage record
    const { error: usageError } = await supabaseAdmin
      .from("workspace_usage")
      .insert({
        workspace_id: newWorkspace.id,
        analyses_used: 0,
        packs_used: 0,
      });

    if (usageError) {
      console.error(`${logPrefix} Failed to create usage record:`, usageError.message);
      // Don't fail - workspace still works without initial usage record
    }

    // Create workspace_branding record
    const { error: brandingError } = await supabaseAdmin
      .from("workspace_branding")
      .insert({
        workspace_id: newWorkspace.id,
      });

    if (brandingError) {
      console.error(`${logPrefix} Failed to create branding record:`, brandingError.message);
      // Don't fail - workspace still works without initial branding record
    }

    return {
      workspace: newWorkspace as WorkspaceData,
      isOwner: true,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`${logPrefix} Unexpected error:`, errorMessage);
    return {
      error: "Failed to load workspace. Please try again.",
      status: 500,
    };
  }
}

/**
 * Check if the result is an error
 */
export function isWorkspaceError(result: WorkspaceResult | WorkspaceError): result is WorkspaceError {
  return "error" in result;
}

/**
 * Get workspace usage data, creating record if it doesn't exist
 */
export async function getOrCreateWorkspaceUsage(
  supabaseAdmin: any,
  workspaceId: string
): Promise<{ analyses_used: number; packs_used: number } | null> {
  const { data: usage, error: usageError } = await supabaseAdmin
    .from("workspace_usage")
    .select("analyses_used, packs_used")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (usage) {
    return usage;
  }

  // Create usage record if it doesn't exist
  if (usageError || !usage) {
    console.log("[workspace-helper] Creating missing usage record for workspace:", workspaceId);
    const { data: newUsage, error: createError } = await supabaseAdmin
      .from("workspace_usage")
      .insert({
        workspace_id: workspaceId,
        analyses_used: 0,
        packs_used: 0,
      })
      .select("analyses_used, packs_used")
      .single();

    if (createError) {
      console.error("[workspace-helper] Failed to create usage record:", createError.message);
      return { analyses_used: 0, packs_used: 0 };
    }

    return newUsage;
  }

  return { analyses_used: 0, packs_used: 0 };
}
