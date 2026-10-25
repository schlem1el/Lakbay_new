import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  Users,
  UserPlus,
  Search,
  RefreshCw,
  ShieldCheck,
  UserX,
  UserCheck,
  AlertCircle,
  KeyRound,
  Shield,
  Edit,
} from 'lucide-react';

const STAFF_ROLES = ['coordinator', 'support', 'guide', 'admin'];

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

export const StaffCustomersPage = () => {
  const { user: currentStaffUser } = useStaffAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Create Staff Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'support',
  });

  // Change Role Modal
  const [selectedUserForRole, setSelectedUserForRole] = useState(null);
  const [newRole, setNewRole] = useState('support');
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getUsers({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
      });
      setUsers(res.data || res || []);
    } catch (err) {
      console.error('[StaffCustomersPage] Error:', err);
      setError(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  // Create Staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    if (!createForm.email || !createForm.password || !createForm.fullName) {
      alert('Full Name, Email, and Password are required.');
      return;
    }

    try {
      setCreating(true);
      await adminApi.createStaffAccount(createForm);
      alert(`Staff account for ${createForm.fullName} (${createForm.role}) created successfully!`);
      setIsCreateModalOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        password: '',
        phone: '',
        role: 'support',
      });
      fetchUsers();
    } catch (err) {
      console.error('[CreateStaff] Error:', err);
      alert(err.message || 'Failed to create staff account.');
    } finally {
      setCreating(false);
    }
  };

  // Toggle Account Status
  const handleToggleStatus = async (userRecord) => {
    if (userRecord.uid === currentStaffUser?.uid) {
      alert('You cannot deactivate your own administrative account.');
      return;
    }

    const currentStatus = userRecord.accountStatus || 'active';
    const targetStatus = currentStatus === 'active' ? 'deactivated' : 'active';

    const confirmed = window.confirm(
      `Are you sure you want to change ${userRecord.fullName || userRecord.email}'s account status to ${targetStatus.toUpperCase()}?`
    );
    if (!confirmed) return;

    try {
      await adminApi.setUserAccountStatus(userRecord.uid || userRecord.id, targetStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === userRecord.uid || u.id === userRecord.id
            ? { ...u, accountStatus: targetStatus }
            : u
        )
      );
    } catch (err) {
      console.error('[ToggleStatus] Error:', err);
      alert(err.message || 'Failed to update account status.');
    }
  };

  // Update Role
  const handleSaveRole = async (e) => {
    e.preventDefault();
    if (!selectedUserForRole) return;

    try {
      setUpdatingRole(true);
      await adminApi.setUserRole(selectedUserForRole.uid || selectedUserForRole.id, newRole);
      alert(`Role for ${selectedUserForRole.fullName} updated to ${newRole}`);
      setSelectedUserForRole(null);
      fetchUsers();
    } catch (err) {
      console.error('[SaveRole] Error:', err);
      alert(err.message || 'Failed to update role.');
    } finally {
      setUpdatingRole(false);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.phone?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Identity & Access Management (IAM)
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage staff credentials, custom security claims, role permissions, and customer accounts.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="w-full shrink-0 sm:w-auto">
          <UserPlus className="h-4 w-4" />
          Provision Staff Member
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className={`${fieldClass} h-10 sm:w-44`}
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="coordinator">Coordinator</option>
            <option value="support">Support Agent</option>
            <option value="guide">Tour Guide</option>
            <option value="customer">Customer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${fieldClass} h-10 sm:w-44`}
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="deactivated">Deactivated</option>
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchUsers}
            className="h-10 w-full text-slate-500 sm:w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead>User Profile</TableHead>
              <TableHead>Role / Custom Claim</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Loading user records...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                  No user accounts found matching your filter criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((u) => {
                const isSelf = u.uid === currentStaffUser?.uid;
                const isActive = u.accountStatus === 'active';
                return (
                  <TableRow key={u.id || u.uid}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold uppercase text-slate-700 ring-1 ring-inset ring-slate-200">
                          {u.fullName?.charAt(0) || u.email?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 font-medium text-foreground">
                            <span className="truncate">{u.fullName || 'User'}</span>
                            {isSelf && (
                              <Badge variant="outline" className="px-1.5 text-[10px]">
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          u.role === 'admin'
                            ? 'destructive'
                            : u.role === 'coordinator'
                            ? 'info'
                            : u.role === 'guide'
                            ? 'success'
                            : u.role === 'support'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="capitalize"
                      >
                        {u.role || 'customer'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-slate-600">
                      {u.phone || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isActive ? 'success' : 'destructive'} className="capitalize">
                        {u.accountStatus || 'active'}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-muted-foreground">
                      {(u.createdAt || '').substring(0, 10)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUserForRole(u);
                            setNewRole(u.role || 'support');
                          }}
                          className="h-8 w-8 text-slate-500 hover:text-foreground"
                          title="Change Role"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!isSelf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(u)}
                            className={`h-8 w-8 text-slate-500 ${
                              isActive
                                ? 'hover:bg-red-50 hover:text-red-600'
                                : 'hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                            title={isActive ? 'Deactivate Account' : 'Reactivate Account'}
                          >
                            {isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Staff Account Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Provision Staff Account
            </DialogTitle>
            <DialogDescription>
              Creates a Firebase Auth user, assigns a custom claim role, and provisions the database record.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-name">Full Legal Name *</Label>
              <Input
                id="staff-name"
                placeholder="Juan Dela Cruz"
                value={createForm.fullName}
                onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Staff Corporate Email *</Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="juan@lakbay.ph"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="staff-password">Temporary Password *</Label>
              <Input
                id="staff-password"
                type="password"
                placeholder="••••••••••••"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="staff-role">Assigned Staff Role *</Label>
                <select
                  id="staff-role"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className={`${fieldClass} h-10`}
                  required
                >
                  <option value="support">Support Agent</option>
                  <option value="coordinator">Coordinator</option>
                  <option value="guide">Tour Guide</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="staff-phone">Contact Phone</Label>
                <Input
                  id="staff-phone"
                  placeholder="+639171234567"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creating}>
                {creating ? 'Provisioning...' : 'Create Staff Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Change Role Modal */}
      <Dialog
        open={Boolean(selectedUserForRole)}
        onOpenChange={(open) => !open && setSelectedUserForRole(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Update User Role
            </DialogTitle>
            <DialogDescription>
              Assign new security permissions for <strong className="font-medium text-foreground">{selectedUserForRole?.fullName}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveRole} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-role-select">Select Role</Label>
              <select
                id="new-role-select"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className={`${fieldClass} h-10`}
              >
                <option value="customer">Customer</option>
                <option value="support">Support Agent</option>
                <option value="coordinator">Coordinator</option>
                <option value="guide">Tour Guide</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-muted-foreground">
              Note: Updating this will refresh the user's custom user token claims in Firebase Auth.
            </p>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedUserForRole(null)}
                disabled={updatingRole}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updatingRole}>
                {updatingRole ? 'Updating...' : 'Save Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
