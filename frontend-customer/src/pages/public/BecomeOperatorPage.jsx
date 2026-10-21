import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { operatorsApi } from '../../api/operatorsApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import {
  Compass,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  FileCheck2,
  Users,
  ShieldCheck,
  CreditCard,
  Send,
  Loader2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export const BecomeOperatorPage = () => {
  const { user, profile } = useAuth();

  const [agencyName, setAgencyName] = useState('');
  const [accreditationNumber, setAccreditationNumber] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [officeAddress, setOfficeAddress] = useState('');
  const [description, setDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Existing application state
  const [existingApp, setExistingApp] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(false);

  useEffect(() => {
    if (user) {
      setContactPerson(profile?.fullName || user.displayName || '');
      setEmail(user.email || '');
      setPhone(profile?.phone || '');

      setLoadingExisting(true);
      operatorsApi
        .getMyApplication()
        .then((res) => {
          if (res.data) setExistingApp(res.data);
        })
        .catch((err) => console.warn('Could not check existing operator application:', err))
        .finally(() => setLoadingExisting(false));
    }
  }, [user, profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!agencyName.trim() || !accreditationNumber.trim() || !contactPerson.trim() || !email.trim() || !phone.trim()) {
      setErrorMsg('Please complete all required fields (Agency Name, Accreditation No, Contact Person, Email, and Phone).');
      return;
    }

    try {
      setSubmitting(true);
      const res = await operatorsApi.apply({
        agencyName,
        accreditationNumber,
        contactPerson,
        email,
        phone,
        officeAddress,
        description,
      });

      setSubmittedData(res.data);
      setExistingApp(res.data);
    } catch (err) {
      console.error('Operator application submission error:', err);
      setErrorMsg(err.message || 'Failed to submit operator application. Please verify your info.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold mb-3">
            <Compass className="h-3.5 w-3.5 mr-1 text-emerald-600 inline" /> Partner With Lakbay
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 font-heading">
            Expand Your Travel Agency & Tour Operations
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Join the Philippines' curated multi-day tour network. List your exclusive island adventures, manage departures, automate reservations, and verify traveler manifests with DOT accreditation compliance.
          </p>
        </div>

        {/* Existing Application Status Card */}
        {existingApp && (
          <div className="mb-10">
            <div
              className={`rounded-2xl p-6 border shadow-sm ${
                existingApp.status === 'approved'
                  ? 'bg-emerald-50/80 border-emerald-200'
                  : existingApp.status === 'rejected'
                  ? 'bg-red-50/80 border-red-200'
                  : 'bg-amber-50/80 border-amber-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  {existingApp.status === 'approved' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                  ) : existingApp.status === 'rejected' ? (
                    <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                  ) : (
                    <Clock className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900 font-heading">
                        Application Status: {existingApp.status?.toUpperCase()}
                      </h3>
                      <Badge
                        className={`text-xs uppercase font-bold border-none ${
                          existingApp.status === 'approved'
                            ? 'bg-emerald-600 text-white'
                            : existingApp.status === 'rejected'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-500 text-white'
                        }`}
                      >
                        {existingApp.status}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 mt-1">
                      Agency: <strong className="text-slate-800">{existingApp.agencyName}</strong> (Accreditation: {existingApp.accreditationNumber})
                    </p>

                    {existingApp.status === 'pending' && (
                      <p className="text-xs text-amber-800 mt-2 font-medium">
                        Your application is currently being vetted by the Lakbay compliance team. Please allow 24–48 business hours for review.
                      </p>
                    )}

                    {existingApp.status === 'approved' && (
                      <p className="text-xs text-emerald-800 mt-2 font-medium">
                        Your Tour Operator account is active! You can now log into the Lakbay Operations Portal to create tour packages and manage departures.
                      </p>
                    )}

                    {existingApp.status === 'rejected' && (
                      <div className="mt-2 text-xs text-red-800">
                        <span className="font-bold">Reviewer Feedback:</span> {existingApp.reviewNotes || 'Credentials could not be verified at this time.'}
                      </div>
                    )}
                  </div>
                </div>

                {existingApp.status === 'approved' && (
                  <a
                    href="http://localhost:5174"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md">
                      Go to Operator Portal <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-5">
            <Building2 className="h-7 w-7 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-base font-heading">Direct Agency Ownership</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Create and manage your own tour packages, custom multi-day itineraries, pricing, and high-res photo showcases.
            </p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-5">
            <Users className="h-7 w-7 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-base font-heading">Manifests & Check-In</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Access real-time passenger manifests, passenger emergency contacts, dietary notes, and mobile check-in verification.
            </p>
          </Card>

          <Card className="rounded-2xl border-slate-200/80 bg-white shadow-sm p-5">
            <ShieldCheck className="h-7 w-7 text-emerald-600 mb-3" />
            <h3 className="font-bold text-slate-900 text-base font-heading">DOT & LGU Verified</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Build customer trust with official accreditation badges, transparent reviews, and verified traveler feedback.
            </p>
          </Card>
        </div>

        {/* Operator Application Form */}
        {(!existingApp || existingApp.status === 'rejected') && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-xl">
            <div className="mb-8">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
                Official Registration
              </span>
              <h2 className="text-2xl font-black text-slate-900 font-heading">
                Tour Operator Accreditation Form
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Please provide legitimate enterprise or agency credentials. Applications are vetted prior to activating package publication privileges.
              </p>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl bg-red-50 p-4 text-xs text-red-700 border border-red-200 mb-6">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Agency / Business Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. Coron Island Escapes & Tours"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    DOT / LGU License No. <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="e.g. DOT-RO4B-TOP-2024-0012"
                    value={accreditationNumber}
                    onChange={(e) => setAccreditationNumber(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Primary Contact Person <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="Full name of representative"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Official Business Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    placeholder="agency@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Contact Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    placeholder="+63 917 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="h-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Office / Headquarters Address
                </Label>
                <Input
                  placeholder="Street Address, City / Municipality, Province"
                  value={officeAddress}
                  onChange={(e) => setOfficeAddress(e.target.value)}
                  className="h-10 text-sm"
                />
              </div>

              <div>
                <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Agency Overview & Tour Offerings
                </Label>
                <textarea
                  rows={4}
                  placeholder="Describe your tour specialties, popular routes, licensed equipment (e.g. motorized outrigger boats, vans), and years in operation..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <span className="text-[11px] text-slate-400">
                  By submitting, you certify that all business accreditation details provided are legitimate and current.
                </span>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-emerald-600/30 cursor-pointer shrink-0 gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
