import React, { useState, useEffect } from 'react';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { adminApi } from '../../api/adminApi';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { auth } from '../../firebase/firebase';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import {
  User,
  Shield,
  KeyRound,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  CheckCheck,
  Lock,
  Mail,
  Phone,
  Compass,
  FileText,
  Save,
} from 'lucide-react';

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

const inputIconClass = 'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400';

export const SettingsPage = () => {
  const { user, profile, role, updateProfileState } = useStaffAuth();

  // Profile Form State
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [languages, setLanguages] = useState(profile?.languages || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [copiedUid, setCopiedUid] = useState(false);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Keep state updated if profile loads late
  useEffect(() => {
    if (profile) {
      if (!fullName) setFullName(profile.fullName || '');
      if (!phone) setPhone(profile.phone || '');
      if (!bio) setBio(profile.bio || '');
      if (!languages) setLanguages(profile.languages || '');
    }
  }, [profile]);

  // Copy UID helper
  const handleCopyUid = () => {
    const uid = profile?.uid || user?.uid;
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  // Handle Profile Update
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');

    if (!fullName.trim()) {
      setProfileError('Full name cannot be empty.');
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        languages: languages.trim(),
      };

      const res = await adminApi.updateStaffProfile(payload);
      const updated = res.data || payload;

      // Update local context profile state for immediate UI sync
      updateProfileState(updated);
      setProfileSuccess('Profile details successfully updated!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      console.error('[SettingsPage] Profile update error:', err);
      setProfileError(err.response?.data?.message || err.message || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handle Password Change with Re-authentication
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    try {
      setUpdatingPassword(true);
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        throw new Error('No authenticated user session found.');
      }

      // 1. Re-authenticate with current credentials
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);

      // 2. Set new password
      await updatePassword(currentUser, newPassword);

      setPasswordSuccess('Password successfully changed! Use your new password for your next sign-in.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      console.error('[SettingsPage] Password update error:', err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPasswordError('Current password is incorrect. Please verify and try again.');
      } else if (err.code === 'auth/weak-password') {
        setPasswordError('Password is too weak. Please use a stronger combination.');
      } else {
        setPasswordError(err.message || 'Failed to update password.');
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  const roleBadgeVariant =
    role === 'admin'
      ? 'destructive'
      : role === 'coordinator'
      ? 'info'
      : role === 'guide'
      ? 'success'
      : 'secondary';

  const roleTitle =
    role === 'admin'
      ? 'Platform Administrator'
      : role === 'coordinator'
      ? 'Tour Coordinator'
      : role === 'guide'
      ? 'Licensed Tour Guide'
      : 'Customer Support Specialist';

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">Account Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal staff details, password credentials, and platform access.
        </p>
      </div>

      {/* User Header Profile Banner */}
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-lg font-semibold text-slate-700 ring-1 ring-inset ring-slate-200">
            {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : 'S'}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground">{profile?.fullName || 'Staff Member'}</h2>
              <Badge variant={roleBadgeVariant} className="capitalize">
                {role || 'Staff'}
              </Badge>
            </div>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">{profile?.email || user?.email}</p>
          </div>
        </div>

        <div className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-slate-50 py-1 pl-3 pr-1 text-xs text-muted-foreground sm:w-auto sm:justify-start">
          <span className="font-medium text-slate-600">UID:</span>
          <span className="font-mono">{user?.uid ? `${user.uid.substring(0, 10)}...` : 'N/A'}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleCopyUid}
            className="h-7 w-7 text-slate-500"
            title="Copy full UID"
          >
            {copiedUid ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Section 1: Personal Profile */}
        <Card>
          <form onSubmit={handleSaveProfile}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-slate-400" />
                <CardTitle>Personal Profile Information</CardTitle>
              </div>
              <CardDescription>
                Update your contact details and display name visible in departures and internal audit records.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {profileSuccess && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{profileSuccess}</span>
                </div>
              )}
              {profileError && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{profileError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Maria Santos"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className={inputIconClass} />
                    <Input
                      id="phone"
                      type="text"
                      className="pl-9 tabular-nums"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 917 123 4567"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address (Account Identifier)</Label>
                  <div className="relative">
                    <Mail className={inputIconClass} />
                    <Input
                      id="email"
                      type="email"
                      className="pl-9"
                      value={profile?.email || user?.email || ''}
                      disabled
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Email is linked to authentication credentials and managed by administrators.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label>Staff Access Role</Label>
                  <div className="flex h-10 items-center gap-2 rounded-md border border-border bg-slate-50 px-3 text-sm text-slate-700">
                    <Shield className="h-4 w-4 text-slate-400" />
                    <span className="font-medium">{roleTitle}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Access privileges are governed strictly through Staff IAM policies.
                  </p>
                </div>
              </div>

              {/* Tour Guide extra fields */}
              {role === 'guide' && (
                <div className="space-y-4 border-t border-border pt-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="languages">Languages Spoken</Label>
                    <Input
                      id="languages"
                      type="text"
                      value={languages}
                      onChange={(e) => setLanguages(e.target.value)}
                      placeholder="e.g. English, Tagalog, Cebuano, Ilocano"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="bio">Tour Guide Bio & Certifications</Label>
                    <textarea
                      id="bio"
                      rows={4}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className={`${fieldClass} resize-y`}
                      placeholder="Brief summary of certifications, years guiding, or local island specialties..."
                    />
                  </div>
                </div>
              )}
            </CardContent>

            <CardFooter className="justify-end border-t border-border pt-4 sm:pt-4">
              <Button type="submit" disabled={savingProfile} className="w-full sm:w-auto">
                {savingProfile ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Section 2: Security & Password */}
        <Card>
          <form onSubmit={handleUpdatePassword}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-slate-400" />
                <CardTitle>Security & Password</CardTitle>
              </div>
              <CardDescription>
                Update your login password. For security, your current password is required before making changes.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              {passwordSuccess && (
                <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{passwordSuccess}</span>
                </div>
              )}
              {passwordError && (
                <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1.5 md:max-w-[calc(50%-0.5rem)]">
                <Label htmlFor="currentPassword">
                  Current Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className={inputIconClass} />
                  <Input
                    id="currentPassword"
                    type="password"
                    className="pl-9"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">
                    New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className={inputIconClass} />
                    <Input
                      id="newPassword"
                      type="password"
                      className="pl-9"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">
                    Confirm New Password <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className={inputIconClass} />
                    <Input
                      id="confirmPassword"
                      type="password"
                      className="pl-9"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="justify-end border-t border-border pt-4 sm:pt-4">
              <Button
                type="submit"
                variant="outline"
                disabled={updatingPassword}
                className="w-full sm:w-auto"
              >
                {updatingPassword ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Verifying & Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Update Password</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Section 3: Role & Permissions Overview */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-slate-400" />
              <CardTitle>Role Privileges & Permissions</CardTitle>
            </div>
            <CardDescription>
              Summary of operational abilities associated with your assigned staff role ({roleTitle}).
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 gap-px overflow-hidden rounded-md border border-border bg-border md:grid-cols-2">
              <div className="bg-card p-4">
                <span className="text-sm font-medium text-foreground">Tour Operations</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role === 'guide'
                    ? 'Access to assigned departure passenger manifests, live destination weather, and traveler check-in.'
                    : 'Access to Departures schedule management, capacity tracking, and passenger assignments.'}
                </p>
              </div>

              <div className="bg-card p-4">
                <span className="text-sm font-medium text-foreground">Customer Support & Bookings</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role === 'guide'
                    ? 'View-only passenger manifests and dietary/medical notes for assigned tours.'
                    : 'Search bookings, add internal staff notes, reschedule passenger dates, and review refunds.'}
                </p>
              </div>

              <div className="bg-card p-4">
                <span className="text-sm font-medium text-foreground">Catalog Management</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role === 'admin' || role === 'coordinator'
                    ? 'Create and edit Philippine destinations, GPS geocoding, and multi-day tour package itineraries.'
                    : 'Read-only access to published travel catalog data.'}
                </p>
              </div>

              <div className="bg-card p-4">
                <span className="text-sm font-medium text-foreground">Platform Governance & IAM</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {role === 'admin'
                    ? 'Full administrative control, Staff IAM account provisioning, and CSV financial exports.'
                    : 'Governed by organization administrators.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
