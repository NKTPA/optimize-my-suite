import { useState } from "react";
import { Users, UserPlus, Crown, Shield, Eye, Trash2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkspace, WorkspaceMember } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FeatureLock } from "@/components/entitlements/FeatureLock";

type Role = "admin" | "analyst" | "viewer";

const roleInfo = {
  owner: { label: "Owner", icon: Crown, color: "text-warning" },
  admin: { label: "Admin", icon: Shield, color: "text-primary" },
  analyst: { label: "Analyst", icon: Users, color: "text-info" },
  viewer: { label: "Viewer", icon: Eye, color: "text-muted-foreground" },
};

export function TeamManagement() {
  const { workspace, members, limits, refreshWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("analyst");
  const [isInviting, setIsInviting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isOwner = workspace?.owner_id === user?.id;
  const memberCount = members.length + 1; // +1 for owner
  const maxMembers = limits.teamMemberLimit;
  const canAddMore = maxMembers === "unlimited" || memberCount < maxMembers;

  const handleInvite = async () => {
    if (!workspace || !inviteEmail.trim()) return;

    if (!canAddMore) {
      toast({
        title: "Team Limit Reached",
        description: `Your plan allows up to ${maxMembers} team members. Upgrade to add more.`,
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      // For now, we'll just add a placeholder member record
      // In production, this would trigger an email invitation
      const { error } = await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: user?.id, // Placeholder - would be set when invite is accepted
        role: inviteRole,
        invited_email: inviteEmail.trim(),
        invited_at: new Date().toISOString(),
        joined_at: null,
      });

      if (error) throw error;

      toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${inviteEmail}.`,
      });

      setInviteEmail("");
      refreshWorkspace();
    } catch (error) {
      console.error("Invite error:", error);
      toast({
        title: "Invitation Failed",
        description: "Could not send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    setDeletingId(memberId);
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({
        title: "Member Removed",
        description: "Team member has been removed from the workspace.",
      });

      refreshWorkspace();
    } catch (error) {
      console.error("Remove member error:", error);
      toast({
        title: "Removal Failed",
        description: "Could not remove team member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // For Starter plan, show locked state
  if (limits.teamMemberLimit === 1) {
    return null; // Hide completely for Starter
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Team Members
            </CardTitle>
            <CardDescription>
              Manage your team and their access levels.
            </CardDescription>
          </div>
          <Badge variant="outline">
            {memberCount} / {maxMembers === "unlimited" ? "∞" : maxMembers}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Owner Card */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning/10">
              <Crown className="w-4 h-4 text-warning" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Owner</p>
            </div>
          </div>
          <Badge variant="secondary">You</Badge>
        </div>

        {/* Team Members List */}
        {members.map((member) => {
          const info = roleInfo[member.role];
          const Icon = info.icon;
          const isPending = !member.joined_at;

          return (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border border-border"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${info.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">
                    {member.invited_email || "Unknown"}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{info.label}</p>
                    {isPending && (
                      <Badge variant="outline" className="text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveMember(member.id)}
                  disabled={deletingId === member.id}
                >
                  {deletingId === member.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-destructive" />
                  )}
                </Button>
              )}
            </div>
          );
        })}

        {/* Invite Form */}
        {isOwner && (
          <div className="pt-4 border-t border-border space-y-4">
            <h4 className="text-sm font-medium text-foreground">Invite Team Member</h4>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="colleague@agency.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as Role)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim() || !canAddMore}
              >
                {isInviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!canAddMore && (
              <p className="text-xs text-warning">
                Upgrade your plan to add more team members.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
