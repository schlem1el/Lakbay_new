import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { customerApi } from '../../api/customerApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { User, Shield, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const ProfilePage = () => {
  const { user, profile, setProfile, logout } = useAuth();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Deactivation state
  const [deactivating, setDeactivating] = useState(false);
  const [deactivateError, setDeactivateError] = useState('');

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setPhone(profile.phone || '');
      setEmergencyContact(profile.emergencyContact || '');
    }
  }, [profile]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const res = await customerApi.updateProfile({
        fullName,
        phone,
        emergencyContact,
      });
      setProfile((prev) => ({ ...prev, fullName, phone, emergencyContact }));
      setSuccessMessage('Profile details updated successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setErrorMessage(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    const confirmDeactivate = window.confirm(
      'Are you sure you want to deactivate your account? You will not be able to log in until reactivated by support.'
    );
    if (!confirmDeactivate) return;

    setDeactivating(true);
    setDeactivateError('');

    try {
      await customerApi.deactivateAccount();
      await logout();
      alert('Your account has been deactivated.');
    } catch (err) {
      console.error('Deactivation error:', err);
      setDeactivateError(err.message || 'Failed to deactivate account.');
      setDeactivating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-black text-slate-900 font-heading">
          Profile & Security
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal details, emergency contacts, and account security.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <Card className="rounded-2xl border-slate-200 shadow-sm">
        <CardContent className="p-7">
          <form onSubmit={handleProfileSave} className="space-y-5">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Personal Information
            </h3>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Email Address (Read-only)</Label>
              <Input
                type="email"
                disabled
                value={user?.email || ''}
                className="mt-1 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
              <Input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
              <Input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Emergency Contact (Name & Number)</Label>
              <Input
                type="text"
                placeholder="e.g. Maria Santos (+63 918 765 4321)"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="mt-1"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Used by tour coordinators during island expeditions if you cannot be reached.
              </p>
            </div>

            <Button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone: Deactivate Account */}
      <Card className="rounded-2xl border-red-100 bg-red-50/20 shadow-sm">
        <CardContent className="p-7">
          <h3 className="text-lg font-bold text-red-900 font-heading mb-2 flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Deactivate Account
          </h3>
          <p className="text-xs text-slate-600 mb-4 leading-relaxed">
            Deactivating your account will block future logins and disable notifications. You may only deactivate your account if you have no active or pending tour bookings.
          </p>

          {deactivateError && (
            <div className="mb-4 rounded-xl bg-red-100 p-3 text-xs text-red-800 font-medium">
              {deactivateError}
            </div>
          )}

          <Button
            variant="destructive"
            onClick={handleDeactivate}
            disabled={deactivating}
            className="text-xs font-bold"
          >
            {deactivating ? 'Verifying Bookings...' : 'Deactivate My Account'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
