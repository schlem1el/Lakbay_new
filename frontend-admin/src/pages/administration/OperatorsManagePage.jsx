import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../../components/ui/dialog';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/table';
import {
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  FileText,
  Loader2,
  UserCheck,
  UserX,
} from 'lucide-react';

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

const tabClass = (isActive) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors cursor-pointer ${
    isActive ? 'bg-forest text-white' : 'text-slate-600 hover:bg-sage-soft hover:text-forest'
  }`;

export const OperatorsManagePage = () => {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'operators' | 'all_apps'
  const [applications, setApplications] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reject Dialog
  const [appToReject, setAppToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('DOT Accreditation or business permit could not be verified');
  const [isRejecting, setIsRejecting] = useState(false);

  // Approve Dialog
  const [appToApprove, setAppToApprove] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  // Status toggle action
  const [togglingUid, setTogglingUid] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [appsRes, opsRes] = await Promise.all([
        adminApi.getOperatorApplications(),
        adminApi.getAllOperators(),
      ]);

      setApplications(appsRes.data || []);
      setOperators(opsRes.data || []);
    } catch (err) {
      console.error('[OperatorsManagePage] Fetch error:', err);
      setError(err.message || 'Failed to load operator records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveConfirm = async () => {
    if (!appToApprove) return;
    try {
      setIsApproving(true);
      await adminApi.approveOperatorApplication(appToApprove.id);
      setSuccessMsg(`Application approved! ${appToApprove.agencyName} is now an accredited Tour Operator.`);
      setAppToApprove(null);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('[ApproveOperator] Error:', err);
      setError(err.message || 'Failed to approve operator application.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!appToReject) return;
    try {
      setIsRejecting(true);
      await adminApi.rejectOperatorApplication(appToReject.id, rejectReason);
      setSuccessMsg(`Application for ${appToReject.agencyName} rejected.`);
      setAppToReject(null);
      await fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('[RejectOperator] Error:', err);
      setError(err.message || 'Failed to reject operator application.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleToggleOperatorStatus = async (operator) => {
    try {
      setTogglingUid(operator.uid);
      const newStatus = operator.accountStatus === 'active' ? 'deactivated' : 'active';
      await adminApi.setOperatorStatus(operator.uid, newStatus);

      setOperators((prev) =>
        prev.map((op) => (op.uid === operator.uid ? { ...op, accountStatus: newStatus } : op))
      );

      setSuccessMsg(`Operator account ${operator.agencyName || operator.fullName} ${newStatus}.`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('[ToggleOperatorStatus] Error:', err);
      setError(err.message || 'Failed to update operator account status.');
      setTimeout(() => setError(''), 4000);
    } finally {
      setTogglingUid(null);
    }
  };

  // Metrics
  const pendingApps = applications.filter((a) => a.status === 'pending');
  const activeOps = operators.filter((o) => o.accountStatus === 'active');
  const deactivatedOps = operators.filter((o) => o.accountStatus === 'deactivated');

  // Filtered applications
  const filteredApps = (
    activeTab === 'pending'
      ? pendingApps
      : applications
  ).filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (a.agencyName || '').toLowerCase().includes(q) ||
      (a.accreditationNumber || '').toLowerCase().includes(q) ||
      (a.contactPerson || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q)
    );
  });

  // Filtered operators
  const filteredOperators = operators.filter((op) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (op.agencyName || '').toLowerCase().includes(q) ||
      (op.accreditationNumber || '').toLowerCase().includes(q) ||
      (op.fullName || '').toLowerCase().includes(q) ||
      (op.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Tour Operator Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review agency accreditation applications, provision operator roles, and oversee accredited partners.
          </p>
        </div>

        <Button
          onClick={fetchData}
          variant="outline"
          disabled={loading}
          className="w-full shrink-0 sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Pending Applications</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
            {pendingApps.length}
          </div>
          <span className="text-xs text-muted-foreground">Awaiting compliance review</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Active Operators</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
            {activeOps.length}
          </div>
          <span className="text-xs text-muted-foreground">Authorized to publish tours</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total Partners</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-500">
              <Building2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
            {operators.length}
          </div>
          <span className="text-xs text-muted-foreground">Registered agency partners</span>
        </div>

        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Deactivated</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600">
              <XCircle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
            {deactivatedOps.length}
          </div>
          <span className="text-xs text-muted-foreground">Suspended privileges</span>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-sand-head p-1">
          <button onClick={() => setActiveTab('pending')} className={tabClass(activeTab === 'pending')}>
            Pending Queue ({pendingApps.length})
          </button>

          <button onClick={() => setActiveTab('operators')} className={tabClass(activeTab === 'operators')}>
            Accredited Operators ({operators.length})
          </button>

          <button onClick={() => setActiveTab('all_apps')} className={tabClass(activeTab === 'all_apps')}>
            All Applications ({applications.length})
          </button>
        </div>

        <div className="relative w-full lg:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search agency, DOT license, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content Section */}
      {activeTab === 'operators' ? (
        /* ACCREDITED OPERATORS TABLE */
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                <Building2 className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-foreground">No accredited tour operators found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Approved applications will appear here as active agency accounts.
              </p>
            </div>
          ) : (
            <Table className="min-w-[900px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Agency & Accreditation</TableHead>
                  <TableHead>Representative</TableHead>
                  <TableHead>Contact Details</TableHead>
                  <TableHead className="text-center">Managed Tours</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperators.map((op) => {
                  const isToggling = togglingUid === op.uid;

                  return (
                    <TableRow key={op.uid}>
                      <TableCell>
                        <div className="font-medium text-foreground">{op.agencyName || op.fullName}</div>
                        <span className="mt-1 inline-block rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-inset ring-slate-200">
                          {op.accreditationNumber || 'Accredited Partner'}
                        </span>
                      </TableCell>

                      <TableCell className="text-slate-700">
                        {op.fullName || 'Official Representative'}
                      </TableCell>

                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-400" /> {op.email}
                        </div>
                        {op.phone && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 text-slate-400" /> {op.phone}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-center font-medium tabular-nums text-foreground">
                        {op.totalPackages || 0}
                      </TableCell>

                      <TableCell>
                        {op.accountStatus === 'active' ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Deactivated</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isToggling}
                          onClick={() => handleToggleOperatorStatus(op)}
                          className={`h-8 ${
                            op.accountStatus === 'active'
                              ? 'text-red-600 hover:bg-red-50 hover:text-red-700'
                              : 'text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800'
                          }`}
                        >
                          {isToggling ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : op.accountStatus === 'active' ? (
                            <>
                              <UserX className="h-3.5 w-3.5" /> Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3.5 w-3.5" /> Reactivate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        /* APPLICATIONS QUEUE & HISTORY */
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="px-4 py-16 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
                <Clock className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-sm font-medium text-foreground">No applications in this view</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeTab === 'pending'
                  ? 'All pending operator applications have been reviewed.'
                  : 'No submitted applications found.'}
              </p>
            </div>
          ) : (
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Agency & Accreditation</TableHead>
                  <TableHead>Applicant Details</TableHead>
                  <TableHead className="w-1/3">Services & Address</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Review Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApps.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{app.agencyName}</div>
                      <span className="mt-1 inline-block rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-inset ring-slate-200">
                        {app.accreditationNumber}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="font-medium text-slate-800">{app.contactPerson}</div>
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 text-slate-400" /> {app.email}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {app.phone}
                      </div>
                    </TableCell>

                    <TableCell className="text-slate-600">
                      {app.officeAddress && (
                        <div className="mb-1 flex items-start gap-1.5 text-xs text-muted-foreground">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span>{app.officeAddress}</span>
                        </div>
                      )}
                      <p className="line-clamp-2 leading-relaxed text-slate-700">
                        {app.description || 'No agency description provided.'}
                      </p>
                    </TableCell>

                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                    </TableCell>

                    <TableCell>
                      {app.status === 'approved' ? (
                        <Badge variant="success">Approved</Badge>
                      ) : app.status === 'rejected' ? (
                        <div>
                          <Badge variant="destructive">Rejected</Badge>
                          {app.reviewNotes && (
                            <p className="mt-1 max-w-[160px] truncate text-xs text-red-600" title={app.reviewNotes}>
                              {app.reviewNotes}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      {app.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => setAppToApprove(app)} className="h-8">
                            <CheckCircle className="h-3.5 w-3.5" /> Approve
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setAppToReject(app)}
                            className="h-8 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Reviewed</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={!!appToApprove} onOpenChange={(open) => !open && setAppToApprove(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Approve Tour Operator Application
            </DialogTitle>
            <DialogDescription className="pt-1">
              You are approving <strong className="font-medium text-foreground">{appToApprove?.agencyName}</strong> (License: {appToApprove?.accreditationNumber}).
              <br />
              <br />
              This will grant this agency the <strong className="font-medium text-foreground">Tour Operator</strong> role, allowing them to access the portal, create tour packages, schedule departures, and oversee passenger manifests.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAppToApprove(null)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button onClick={handleApproveConfirm} disabled={isApproving}>
              {isApproving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" /> Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!appToReject} onOpenChange={(open) => !open && setAppToReject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Reject Operator Application
            </DialogTitle>
            <DialogDescription>
              Provide feedback for <strong className="font-medium text-foreground">{appToReject?.agencyName}</strong> explaining why accreditation could not be granted.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Rejection Reason / Notes
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className={`${fieldClass} resize-y`}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAppToReject(null)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectConfirm} disabled={isRejecting}>
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" /> Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
