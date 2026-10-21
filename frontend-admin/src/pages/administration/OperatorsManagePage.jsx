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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-heading">
            Tour Operator Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review agency accreditation applications, provision operator roles, and oversee accredited partners.
          </p>
        </div>

        <Button
          onClick={fetchData}
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 text-emerald-800 text-sm rounded-xl border border-emerald-200">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600">Pending Applications</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2 font-heading">{pendingApps.length}</div>
          <span className="text-[11px] text-slate-400">Awaiting compliance review</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600">Active Operators</span>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2 font-heading">{activeOps.length}</div>
          <span className="text-[11px] text-emerald-600/80">Authorized to publish tours</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Partners</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 font-heading">{operators.length}</div>
          <span className="text-[11px] text-slate-400">Registered agency partners</span>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-600">Deactivated</span>
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div className="text-2xl font-black text-red-700 mt-2 font-heading">{deactivatedOps.length}</div>
          <span className="text-[11px] text-slate-400">Suspended privileges</span>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'pending'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending Queue ({pendingApps.length})
          </button>

          <button
            onClick={() => setActiveTab('operators')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'operators'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Accredited Operators ({operators.length})
          </button>

          <button
            onClick={() => setActiveTab('all_apps')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
              activeTab === 'all_apps'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Applications ({applications.length})
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search agency, DOT license, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>
      </div>

      {/* Content Section */}
      {activeTab === 'operators' ? (
        /* ACCREDITED OPERATORS TABLE */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredOperators.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No accredited tour operators found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Approved applications will appear here as active agency accounts.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="text-xs font-bold text-slate-700">Agency & Accreditation</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Representative</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Contact Details</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-center">Managed Tours</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Account Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOperators.map((op) => {
                    const isToggling = togglingUid === op.uid;

                    return (
                      <TableRow key={op.uid} className="hover:bg-slate-50/50">
                        <TableCell className="text-xs">
                          <div className="font-bold text-slate-900">{op.agencyName || op.fullName}</div>
                          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-block mt-0.5">
                            {op.accreditationNumber || 'Accredited Partner'}
                          </span>
                        </TableCell>

                        <TableCell className="text-xs font-medium text-slate-800">
                          {op.fullName || 'Official Representative'}
                        </TableCell>

                        <TableCell className="text-xs text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" /> {op.email}
                          </div>
                          {op.phone && (
                            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                              <Phone className="h-3 w-3 text-slate-400" /> {op.phone}
                            </div>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-center font-bold text-slate-800">
                          {op.totalPackages || 0}
                        </TableCell>

                        <TableCell className="text-xs">
                          {op.accountStatus === 'active' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[10px]">
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none font-semibold text-[10px]">
                              Deactivated
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-xs text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isToggling}
                            onClick={() => handleToggleOperatorStatus(op)}
                            className={`h-8 text-xs cursor-pointer ${
                              op.accountStatus === 'active'
                                ? 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                : 'text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                          >
                            {isToggling ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : op.accountStatus === 'active' ? (
                              <>
                                <UserX className="h-3.5 w-3.5 mr-1" /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5 mr-1" /> Reactivate
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      ) : (
        /* APPLICATIONS QUEUE & HISTORY */
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : filteredApps.length === 0 ? (
            <div className="text-center py-16 px-4">
              <Clock className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-700">No applications in this view</h3>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === 'pending'
                  ? 'All pending operator applications have been reviewed.'
                  : 'No submitted applications found.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/70">
                    <TableHead className="text-xs font-bold text-slate-700">Agency & Accreditation</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Applicant Details</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 w-1/3">Services & Address</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Submitted</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700">Status</TableHead>
                    <TableHead className="text-xs font-bold text-slate-700 text-right">Review Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApps.map((app) => (
                    <TableRow key={app.id} className="hover:bg-slate-50/50">
                      <TableCell className="text-xs">
                        <div className="font-bold text-slate-900">{app.agencyName}</div>
                        <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 inline-block mt-0.5">
                          {app.accreditationNumber}
                        </span>
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="font-semibold text-slate-800">{app.contactPerson}</div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                          <Mail className="h-3 w-3 text-slate-400" /> {app.email}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" /> {app.phone}
                        </div>
                      </TableCell>

                      <TableCell className="text-xs text-slate-600">
                        {app.officeAddress && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 mb-1">
                            <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                            <span>{app.officeAddress}</span>
                          </div>
                        )}
                        <p className="line-clamp-2 leading-relaxed text-slate-700">
                          {app.description || 'No agency description provided.'}
                        </p>
                      </TableCell>

                      <TableCell className="text-xs text-slate-500">
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'N/A'}
                      </TableCell>

                      <TableCell className="text-xs">
                        {app.status === 'approved' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-semibold text-[10px]">
                            Approved
                          </Badge>
                        ) : app.status === 'rejected' ? (
                          <div>
                            <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-none font-semibold text-[10px]">
                              Rejected
                            </Badge>
                            {app.reviewNotes && (
                              <p className="text-[10px] text-red-600 mt-0.5 max-w-[150px] truncate" title={app.reviewNotes}>
                                {app.reviewNotes}
                              </p>
                            )}
                          </div>
                        ) : (
                          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 border-none font-semibold text-[10px]">
                            Pending
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-right">
                        {app.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              onClick={() => setAppToApprove(app)}
                              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer gap-1"
                            >
                              <CheckCircle className="h-3.5 w-3.5" /> Approve
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setAppToReject(app)}
                              className="h-8 text-red-600 hover:bg-red-50 border-red-200 font-semibold text-xs cursor-pointer gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={!!appToApprove} onOpenChange={(open) => !open && setAppToApprove(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Approve Tour Operator Application
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-2 leading-relaxed">
              You are approving <strong className="text-slate-900">{appToApprove?.agencyName}</strong> (License: {appToApprove?.accreditationNumber}).
              <br />
              <br />
              This will grant this agency the <strong className="text-emerald-700">Tour Operator</strong> role, allowing them to access the portal, create tour packages, schedule departures, and oversee passenger manifests.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppToApprove(null)}
              disabled={isApproving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleApproveConfirm}
              disabled={isApproving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              {isApproving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-3.5 w-3.5" /> Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!appToReject} onOpenChange={(open) => !open && setAppToReject(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Reject Operator Application
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-1 leading-relaxed">
              Provide feedback for <strong className="text-slate-900">{appToReject?.agencyName}</strong> explaining why accreditation could not be granted.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2">
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Rejection Reason / Notes
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAppToReject(null)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectConfirm}
              disabled={isRejecting}
              className="bg-red-600 hover:bg-red-700 text-white gap-1.5"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Reject Application
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
