import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { ShieldCheck, AlertCircle, KeyRound, Loader2 } from 'lucide-react';
import coronLagoon from '../../assets/coron-lagoon.jpg';

export const StaffLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, authError } = useStaffAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide both staff email and password.');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('[StaffLoginPage] Login error:', err);
      setError(err.message || 'Failed to sign in. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Photo panel — top band on mobile, left column on desktop */}
      <div className="relative overflow-hidden bg-forest lg:w-[46%]">
        <img
          src={coronLagoon}
          alt="Coron lagoon"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-forest-deep via-forest/80 to-forest/30 lg:bg-gradient-to-tr lg:from-forest-deep lg:via-forest/75 lg:to-terracotta/20"
          aria-hidden="true"
        />

        <div className="relative flex h-full min-h-[260px] flex-col justify-between px-6 py-7 sm:px-10 lg:min-h-screen lg:px-14 lg:py-12">
          <span className="relative w-fit font-heading text-3xl leading-none text-white">
            Lakbay
            <span className="absolute -right-3 bottom-1 h-2 w-2 rounded-full bg-terracotta" aria-hidden="true" />
          </span>

          <div className="mt-10 lg:mt-0">
            <h1 className="max-w-md font-heading text-4xl font-normal leading-[1.05] tracking-[-0.005em] text-white sm:text-5xl lg:text-[3.6rem]">
              Lakbay Operations Portal
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/75 sm:text-base">
              Internal Staff & Administration Management System
            </p>
          </div>

          <div className="mt-8 hidden items-end justify-between gap-6 text-xs text-white/55 lg:mt-0 lg:flex">
            <span>Philippine Tourism Platform &bull; All sessions logged for security audit.</span>
            <span className="shrink-0 text-white/40">Photo: Wikimedia Commons</span>
          </div>
        </div>
      </div>

      {/* Form column */}
      <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-[400px]">
          <Card className="rounded-3xl border-border/80 shadow-pop">
            <CardHeader className="pb-4 pt-7 sm:px-8 sm:pb-4 sm:pt-8">
              <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sage-soft">
                <ShieldCheck className="h-5 w-5 text-forest" />
              </span>
              <CardTitle className="text-[1.8rem]">
                Staff Authentication
              </CardTitle>
              <CardDescription>
                Restricted to Coordinators, Support Agents, Guides, and Admins.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 sm:px-8">
                {(error || authError) && (
                  <div
                    role="alert"
                    className="flex items-start gap-3 rounded-xl border border-[#EBC9C3] bg-[#F6E3E0] px-3.5 py-3 text-sm text-status-bad"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                      <span className="block font-bold">Access Restricted</span>
                      <span className="text-xs leading-relaxed">{error || authError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Staff Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@lakbay.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" disabled={submitting} className="mt-2 h-11 w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    'Sign In to Staff Portal'
                  )}
                </Button>
              </CardContent>
            </form>

            {/* Quick Demo Credentials for Reviewers */}
            <CardFooter className="flex flex-col items-stretch border-t border-border pb-7 pt-5 sm:px-8 sm:pb-8 sm:pt-5">
              <span className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <KeyRound className="h-3.5 w-3.5 text-terracotta" />
                Demo Credentials (from Phase 1 Initial Seeder)
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickFill('admin@lakbay.ph', 'AdminPassword123')}
                className="w-full"
              >
                Fill Primary Admin
              </Button>
            </CardFooter>
          </Card>

          <div className="mt-6 text-center text-xs text-muted-foreground lg:hidden">
            Philippine Tourism Platform &bull; All sessions logged for security audit.
          </div>
        </div>
      </div>
    </div>
  );
};
