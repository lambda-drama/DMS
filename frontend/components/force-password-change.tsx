'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { KeyRound, Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import * as userSvc from '@/services/users';

/**
 * Blocking dialog shown when an admin set the user's password for the first time.
 * The user must give the temporary (old) password and choose their own new one.
 */
export function ForcePasswordChangeDialog({ onChanged }: { onChanged: () => void }) {
  const { logout } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && newPassword !== confirm;
  const canSubmit = oldPassword.length > 0 && newPassword.length >= 8 && !mismatch;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirm) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await userSvc.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirm,
      });
      setOldPassword('');
      setNewPassword('');
      setConfirm('');
      toast.success('Password updated');
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
        onInteractOutside={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Set Your Password
          </DialogTitle>
          <DialogDescription>
            Your password was set for you. Enter it once, then choose a new password you will use
            from now on.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="fpc-old">Current (temporary) password</Label>
            <Input
              id="fpc-old"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter the password you signed in with"
              autoComplete="current-password"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fpc-new">New password</Label>
            <Input
              id="fpc-new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fpc-confirm">Confirm new password</Label>
            <Input
              id="fpc-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Re-enter new password"
              autoComplete="new-password"
              className={mismatch ? 'border-destructive' : ''}
              required
            />
            {mismatch ? (
              <p className="text-xs text-destructive">New passwords do not match</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
            <Button type="submit" disabled={saving || !canSubmit}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
