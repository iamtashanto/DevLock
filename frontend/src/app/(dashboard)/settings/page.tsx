'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services/auth.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar } from '@/components/ui/avatar';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const queryClient = useQueryClient();
  const [name, setName] = useState(user?.name || '');

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [customDomain, setCustomDomain] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#000000');
  const [companyName, setCompanyName] = useState('');

  const { data: tenant } = useQuery({
    queryKey: ['tenant'],
    queryFn: () => apiClient.get<any>('/organizations'),
  });

  const updateBrandingMutation = useMutation({
    mutationFn: (data: any) => apiClient.put('/auth/tenant/branding', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] });
    },
  });

  const handleUpdateProfile = async () => {
    if (!name.trim()) return;
    setProfileSaving(true);
    setProfileMsg('');
    try {
      const updated = await authService.updateProfile({ name: name.trim() });
      if (user) setUser({ ...user, name: updated.name });
      setProfileMsg('Profile updated');
    } catch (err: any) {
      setProfileMsg(err?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwMsg(null);
    if (newPassword.length < 8) {
      setPwMsg({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    setPwSaving(true);
    try {
      await authService.changePassword({ currentPassword, newPassword });
      setPwMsg({ type: 'success', text: 'Password changed successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwMsg({ type: 'error', text: err?.message || 'Failed to change password' });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your account preferences" />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar fallback={user?.name || 'U'} size="lg" />
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{user?.role}</p>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="settings-name">Full Name</Label>
              <Input
                id="settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-email">Email</Label>
              <Input
                id="settings-email"
                type="email"
                value={user?.email || ''}
                disabled
                readOnly
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleUpdateProfile} loading={profileSaving} disabled={!name.trim() || name.trim() === user?.name}>
              Update Profile
            </Button>
            {profileMsg && <span className="text-sm text-muted-foreground">{profileMsg}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Change your password</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={handleChangePassword}
              loading={pwSaving}
              disabled={!currentPassword || !newPassword || !confirmPassword}
            >
              Change Password
            </Button>
            {pwMsg && (
              <span className={`text-sm ${pwMsg.type === 'error' ? 'text-destructive' : 'text-green-600'}`}>
                {pwMsg.text}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sessions</CardTitle>
          <CardDescription>Manage your active sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-md border border-border p-3">
            <div>
              <p className="text-sm font-medium">Current Session</p>
              <p className="text-xs text-muted-foreground">This device • Active now</p>
            </div>
            <Button variant="outline" size="sm">
              Sign out other sessions
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tenant Branding (Only for Admin/Owner) */}
      {(user?.role === 'admin' || user?.role === 'owner') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">White-labeling & Branding</CardTitle>
            <CardDescription>Customize the appearance of your customer portal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="custom-domain">Custom Domain</Label>
              <Input
                id="custom-domain"
                placeholder="portal.yourcompany.com"
                defaultValue={tenant?.customDomain || ''}
                onChange={(e) => setCustomDomain(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">CNAME record must point to cname.devlock.io</p>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Acme Corp"
                  defaultValue={tenant?.branding?.companyName || ''}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primary-color">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="primary-color"
                    type="color"
                    className="w-12 h-10 p-1 cursor-pointer"
                    defaultValue={tenant?.branding?.primaryColor || '#000000'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                  />
                  <Input
                    value={primaryColor || tenant?.branding?.primaryColor || '#000000'}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-url">Logo URL</Label>
              <Input
                id="logo-url"
                placeholder="https://example.com/logo.png"
                defaultValue={tenant?.branding?.logoUrl || ''}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  updateBrandingMutation.mutate({
                    customDomain: customDomain || tenant?.customDomain,
                    branding: {
                      companyName: companyName || tenant?.branding?.companyName,
                      primaryColor: primaryColor || tenant?.branding?.primaryColor,
                      logoUrl: logoUrl || tenant?.branding?.logoUrl,
                    }
                  });
                }}
                loading={updateBrandingMutation.isPending}
              >
                Save Branding
              </Button>
              {updateBrandingMutation.isSuccess && (
                <span className="text-sm text-green-600">Saved successfully</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
