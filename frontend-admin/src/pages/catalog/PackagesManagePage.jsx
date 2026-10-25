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
import { ImageUpload } from '../../components/common/ImageUpload';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  Package,
  Check,
  Calendar,
  Clock,
  Info,
  Building2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Loader2,
} from 'lucide-react';

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

const checkboxClass = 'h-4 w-4 shrink-0 rounded border-slate-300 accent-primary cursor-pointer';

export const PackagesManagePage = () => {
  const { role, user } = useStaffAuth();
  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [destFilter, setDestFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending_approval' | 'approved' | 'rejected'

  // Approval / Moderation State
  const [approvingId, setApprovingId] = useState(null);
  const [rejectModalPkg, setRejectModalPkg] = useState(null);
  const [rejectReason, setRejectReason] = useState('Tour details or compliance documents require revision.');
  const [isRejecting, setIsRejecting] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    destinationId: '',
    category: 'Island Hopping',
    description: '',
    pricePerPerson: '',
    discountPercent: 0,
    durationDays: 3,
    durationNights: 2,
    cancellationCutoffDays: 7,
    inclusions: '',
    exclusions: '',
    imageUrls: '',
    isPublished: true,
    isFeatured: false,
    itinerary: [
      {
        dayNumber: 1,
        dayTitle: 'Arrival & Welcome',
        activities: [
          { timeSlot: '09:00 AM', activityName: 'Hotel check-in & Briefing', locationName: '', description: '' },
        ],
      },
    ],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [pkgRes, destRes] = await Promise.all([
        adminApi.getPackages(),
        adminApi.getDestinations(),
      ]);
      setPackages(pkgRes.data || pkgRes || []);
      setDestinations(destRes.data || destRes || []);
    } catch (err) {
      console.error('[PackagesManagePage] Fetch error:', err);
      setError(err.message || 'Failed to load packages.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatPHP = (val) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  const openCreateModal = () => {
    setEditingPackage(null);
    setFormData({
      name: '',
      destinationId: destinations[0]?.id || '',
      category: 'Island Hopping',
      description: '',
      pricePerPerson: '',
      discountPercent: 0,
      durationDays: 3,
      durationNights: 2,
      cancellationCutoffDays: 7,
      inclusions: 'Boat transfers, Environmental fees, Licensed tour guide, Buffet lunch',
      exclusions: 'Personal travel insurance, Souvenirs, Gratuities',
      imageUrls: '',
      isPublished: true,
      isFeatured: false,
      itinerary: [
        {
          dayNumber: 1,
          dayTitle: 'Arrival & Island Exploration',
          activities: [
            { timeSlot: '08:30 AM', activityName: 'Meet & Greet', locationName: '', description: '' },
          ],
        },
      ],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name || '',
      destinationId: pkg.destinationId || '',
      category: pkg.category || 'Island Hopping',
      description: pkg.description || '',
      pricePerPerson: pkg.pricePerPerson?.toString() || '',
      discountPercent: pkg.discountPercent || 0,
      durationDays: pkg.durationDays || 1,
      durationNights: pkg.durationNights || 0,
      cancellationCutoffDays: pkg.cancellationCutoffDays || 7,
      inclusions: (pkg.inclusions || []).join(', '),
      exclusions: (pkg.exclusions || []).join(', '),
      imageUrls: (pkg.imageUrls || []).join('\n'),
      isPublished: Boolean(pkg.isPublished),
      isFeatured: Boolean(pkg.isFeatured),
      itinerary: pkg.itinerary && pkg.itinerary.length > 0
        ? pkg.itinerary
        : [
            {
              dayNumber: 1,
              dayTitle: 'Day 1 Itinerary',
              activities: [{ timeSlot: '09:00 AM', activityName: 'Sightseeing', locationName: '', description: '' }],
            },
          ],
    });
    setIsModalOpen(true);
  };

  // Itinerary builder handlers
  const addDay = () => {
    const nextDayNum = formData.itinerary.length + 1;
    setFormData({
      ...formData,
      itinerary: [
        ...formData.itinerary,
        {
          dayNumber: nextDayNum,
          dayTitle: `Day ${nextDayNum} Excursion`,
          activities: [{ timeSlot: '09:00 AM', activityName: 'Activity', locationName: '', description: '' }],
        },
      ],
    });
  };

  const removeDay = (index) => {
    const updated = formData.itinerary.filter((_, i) => i !== index);
    setFormData({ ...formData, itinerary: updated });
  };

  const updateDayTitle = (index, title) => {
    const updated = [...formData.itinerary];
    updated[index].dayTitle = title;
    setFormData({ ...formData, itinerary: updated });
  };

  const addActivity = (dayIndex) => {
    const updated = [...formData.itinerary];
    updated[dayIndex].activities.push({
      timeSlot: '12:00 PM',
      activityName: 'New Activity',
      locationName: '',
      description: '',
    });
    setFormData({ ...formData, itinerary: updated });
  };

  const updateActivityField = (dayIndex, actIndex, field, value) => {
    const updated = [...formData.itinerary];
    updated[dayIndex].activities[actIndex][field] = value;
    setFormData({ ...formData, itinerary: updated });
  };

  const removeActivity = (dayIndex, actIndex) => {
    const updated = [...formData.itinerary];
    updated[dayIndex].activities = updated[dayIndex].activities.filter((_, i) => i !== actIndex);
    setFormData({ ...formData, itinerary: updated });
  };

  // Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.destinationId || !formData.pricePerPerson) {
      alert('Package name, destination, and price per person are required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        destinationId: formData.destinationId,
        category: formData.category,
        description: formData.description,
        pricePerPerson: Number(formData.pricePerPerson),
        discountPercent: Number(formData.discountPercent) || 0,
        durationDays: Number(formData.durationDays),
        durationNights: Number(formData.durationNights),
        cancellationCutoffDays: Number(formData.cancellationCutoffDays),
        inclusions: formData.inclusions.split(',').map((s) => s.trim()).filter(Boolean),
        exclusions: formData.exclusions.split(',').map((s) => s.trim()).filter(Boolean),
        imageUrls: formData.imageUrls.split('\n').map((s) => s.trim()).filter(Boolean),
        itinerary: formData.itinerary,
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };

      if (editingPackage) {
        await adminApi.updatePackage(editingPackage.id, payload);
      } else {
        await adminApi.createPackage(payload);
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('[SavePackage] Error:', err);
      alert(err.message || 'Failed to save tour package.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle publish
  const handleTogglePublish = async (pkg) => {
    try {
      const updated = !pkg.isPublished;
      await adminApi.updatePackage(pkg.id, { isPublished: updated });
      setPackages((prev) =>
        prev.map((p) => (p.id === pkg.id ? { ...p, isPublished: updated } : p))
      );
    } catch (err) {
      alert('Failed to update published status: ' + err.message);
    }
  };

  // Tour Approval (Admin / Coordinator)
  const handleApprovePackage = async (packageId) => {
    try {
      setApprovingId(packageId);
      await adminApi.approvePackage(packageId);
      setPackages((prev) =>
        prev.map((p) =>
          p.id === packageId ? { ...p, approvalStatus: 'approved', isPublished: true } : p
        )
      );
    } catch (err) {
      console.error('[ApprovePackage] Error:', err);
      alert('Failed to approve package: ' + err.message);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectPackageConfirm = async () => {
    if (!rejectModalPkg) return;
    try {
      setIsRejecting(true);
      await adminApi.rejectPackage(rejectModalPkg.id, rejectReason);
      setPackages((prev) =>
        prev.map((p) =>
          p.id === rejectModalPkg.id
            ? { ...p, approvalStatus: 'rejected', isPublished: false, rejectionReason: rejectReason }
            : p
        )
      );
      setRejectModalPkg(null);
    } catch (err) {
      console.error('[RejectPackage] Error:', err);
      alert('Failed to reject package: ' + err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  // Delete
  const confirmDelete = async () => {
    if (!packageToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      await adminApi.deletePackage(packageToDelete.id);
      setPackageToDelete(null);
      fetchData();
    } catch (err) {
      console.error('[DeletePackage] Error:', err);
      setDeleteError(err.message || 'Failed to delete package.');
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = packages.filter((pkg) => {
    const matchesSearch =
      !search ||
      pkg.name?.toLowerCase().includes(search.toLowerCase()) ||
      pkg.destinationName?.toLowerCase().includes(search.toLowerCase()) ||
      pkg.operatorName?.toLowerCase().includes(search.toLowerCase());
    const matchesDest = !destFilter || pkg.destinationId === destFilter;
    const matchesStatus =
      !statusFilter || statusFilter === 'all'
        ? true
        : (pkg.approvalStatus || 'approved') === statusFilter;
    return matchesSearch && matchesDest && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {role === 'operator' ? 'My Tour Packages' : 'Tour Packages Catalog'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === 'operator'
              ? 'Create, manage, and submit tour packages for compliance approval.'
              : 'Manage multi-day itineraries, pricing, inclusions, and publication visibility.'}
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full shrink-0 sm:w-auto">
          <Plus className="h-4 w-4" />
          Create Tour Package
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search package name or operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:flex sm:items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`${fieldClass} h-10 sm:w-48`}
          >
            <option value="all">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={destFilter}
            onChange={(e) => setDestFilter(e.target.value)}
            className={`${fieldClass} h-10 sm:w-48`}
          >
            <option value="">All Destinations</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            className="h-10 w-full text-slate-500 sm:w-10"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Packages Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[980px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[88px]">Preview</TableHead>
              <TableHead>Package Name</TableHead>
              <TableHead>Destination</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Price / Person</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Loading tour packages...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No tour packages found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((pkg) => {
                const dest = destinations.find((d) => d.id === pkg.destinationId);
                return (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      {pkg.imageUrls?.[0] ? (
                        <img
                          src={pkg.imageUrls[0]}
                          alt={pkg.name}
                          className="h-11 w-14 rounded-md border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-11 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{pkg.name}</span>
                        {pkg.isFeatured && <Badge variant="warning">Featured</Badge>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {pkg.category} &bull; {pkg.cancellationCutoffDays || 7}-day refund cutoff
                      </div>
                      {pkg.operatorName && pkg.operatorId !== 'platform' && (
                        <div className="mt-1.5">
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                            <Building2 className="h-3 w-3 text-slate-400" />
                            {pkg.operatorName}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {dest?.name || pkg.destinationName || 'Destination'}
                    </TableCell>
                    <TableCell className="whitespace-nowrap tabular-nums text-slate-700">
                      {pkg.durationDays}D / {pkg.durationNights || 0}N
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {pkg.discountPercent > 0 ? (
                        <div>
                          <div className="flex items-center gap-1.5 font-medium tabular-nums text-foreground">
                            {formatPHP(pkg.effectivePrice || pkg.discountPrice)}
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-inset ring-red-600/20">
                              -{pkg.discountPercent}%
                            </span>
                          </div>
                          <div className="text-xs tabular-nums text-muted-foreground line-through">
                            {formatPHP(pkg.pricePerPerson)}
                          </div>
                        </div>
                      ) : (
                        <span className="font-medium tabular-nums text-foreground">{formatPHP(pkg.pricePerPerson)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {pkg.approvalStatus === 'pending_approval' ? (
                        <Badge variant="warning">
                          <Clock className="h-3 w-3" /> Pending Review
                        </Badge>
                      ) : pkg.approvalStatus === 'rejected' ? (
                        <Badge variant="destructive" title={pkg.rejectionReason}>
                          <XCircle className="h-3 w-3" /> Rejected
                        </Badge>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTogglePublish(pkg)}
                          className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                          title="Click to toggle publish status"
                        >
                          {pkg.isPublished ? (
                            <Badge variant="success">
                              <Check className="h-3 w-3" /> Live
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">
                              Draft (Hidden)
                            </Badge>
                          )}
                        </button>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Admin / Coordinator Approval Quick Actions */}
                        {['admin', 'coordinator'].includes(role) && pkg.approvalStatus === 'pending_approval' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprovePackage(pkg.id)}
                              disabled={approvingId === pkg.id}
                              className="h-8 px-2.5 text-xs"
                            >
                              {approvingId === pkg.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setRejectModalPkg(pkg)}
                              className="h-8 border-red-200 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(pkg)}
                          className="h-8 w-8 text-slate-500 hover:text-foreground"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setPackageToDelete(pkg);
                            setDeleteError('');
                          }}
                          className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? 'Edit Tour Package' : 'Create New Tour Package'}
            </DialogTitle>
            <DialogDescription>
              Configure duration, pricing, inclusions, and multi-day itinerary.
            </DialogDescription>
          </DialogHeader>

          {editingPackage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm text-sky-800">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong className="font-medium">Price Preservation:</strong> Changing the base price here only applies to future reservations. Existing bookings maintain their locked historical price.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-name">Package Title *</Label>
                <Input
                  id="pkg-name"
                  placeholder="e.g. El Nido Ultimate Island Hopping Expedition"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg-dest">Destination *</Label>
                <select
                  id="pkg-dest"
                  value={formData.destinationId}
                  onChange={(e) => setFormData({ ...formData, destinationId: e.target.value })}
                  className={`${fieldClass} h-10`}
                  required
                >
                  <option value="">Select Destination</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.region})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & duration */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-price">Price per Person (PHP) *</Label>
                <Input
                  id="pkg-price"
                  type="number"
                  placeholder="12500"
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData({ ...formData, pricePerPerson: e.target.value })}
                  className="tabular-nums"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor="pkg-discount">Discount (%)</Label>
                  {Number(formData.discountPercent) > 0 && Number(formData.pricePerPerson) > 0 && (
                    <span className="text-xs font-medium tabular-nums text-primary">
                      Pays {formatPHP(Math.round(Number(formData.pricePerPerson) * (1 - Number(formData.discountPercent) / 100)))}
                    </span>
                  )}
                </div>
                <Input
                  id="pkg-discount"
                  type="number"
                  min="0"
                  max="90"
                  placeholder="0 (e.g. 15 for 15% off)"
                  value={formData.discountPercent}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountPercent: Math.max(0, Math.min(90, parseInt(e.target.value) || 0)),
                    })
                  }
                  className="tabular-nums"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg-days">Duration (Days / Nights)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Days"
                    value={formData.durationDays}
                    onChange={(e) =>
                      setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })
                    }
                    className="tabular-nums"
                  />
                  <Input
                    type="number"
                    min="0"
                    placeholder="Nights"
                    value={formData.durationNights}
                    onChange={(e) =>
                      setFormData({ ...formData, durationNights: parseInt(e.target.value) || 0 })
                    }
                    className="tabular-nums"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg-cutoff">Refund Cutoff (Days)</Label>
                <Input
                  id="pkg-cutoff"
                  type="number"
                  min="1"
                  placeholder="7"
                  value={formData.cancellationCutoffDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cancellationCutoffDays: parseInt(e.target.value) || 7,
                    })
                  }
                  className="tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pkg-desc">Overview & Description</Label>
              <textarea
                id="pkg-desc"
                rows={3}
                placeholder="Comprehensive tour description..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${fieldClass} resize-y`}
              />
            </div>

            {/* Inclusions and Exclusions */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pkg-inc">Inclusions (Comma-separated)</Label>
                <textarea
                  id="pkg-inc"
                  rows={3}
                  placeholder="Boat transfers, Environmental fees, Buffet lunch"
                  value={formData.inclusions}
                  onChange={(e) => setFormData({ ...formData, inclusions: e.target.value })}
                  className={`${fieldClass} resize-y`}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pkg-exc">Exclusions (Comma-separated)</Label>
                <textarea
                  id="pkg-exc"
                  rows={3}
                  placeholder="Airfare, Personal expenses, Travel insurance"
                  value={formData.exclusions}
                  onChange={(e) => setFormData({ ...formData, exclusions: e.target.value })}
                  className={`${fieldClass} resize-y`}
                />
              </div>
            </div>

            {/* Daily Itinerary Builder */}
            <div className="rounded-md border border-border">
              <div className="flex flex-col gap-3 border-b border-border bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    Day-by-Day Itinerary Builder
                  </h4>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Define scheduled activities and stops. Location names are auto-geocoded for the customer map.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDay}
                  className="w-full shrink-0 sm:w-auto"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Day
                </Button>
              </div>

              <div className="divide-y divide-border">
                {formData.itinerary.map((day, dayIdx) => (
                  <div key={dayIdx} className="space-y-3 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-1 items-center gap-2.5 sm:max-w-md">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold tabular-nums text-slate-700">
                          {dayIdx + 1}
                        </span>
                        <Input
                          value={day.dayTitle}
                          onChange={(e) => updateDayTitle(dayIdx, e.target.value)}
                          placeholder={`Day ${dayIdx + 1} Title`}
                          className="h-9 font-medium"
                        />
                      </div>
                      <div className="flex items-center gap-1 pl-9 sm:pl-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => addActivity(dayIdx)}
                          className="h-8 px-2.5 text-xs text-primary hover:text-primary"
                        >
                          + Activity
                        </Button>
                        {formData.itinerary.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDay(dayIdx)}
                            className="h-8 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            Remove Day
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Activities List */}
                    <div className="space-y-2 border-l border-border pl-4 sm:ml-3.5 sm:pl-5">
                      {day.activities.map((act, actIdx) => (
                        <div
                          key={actIdx}
                          className="relative grid grid-cols-1 gap-2 rounded-md border border-border p-2 pr-10 sm:grid-cols-12 sm:items-center sm:border-0 sm:p-0 sm:pr-0"
                        >
                          <Input
                            placeholder="09:00 AM"
                            value={act.timeSlot}
                            onChange={(e) =>
                              updateActivityField(dayIdx, actIdx, 'timeSlot', e.target.value)
                            }
                            className="h-9 tabular-nums sm:col-span-3"
                          />
                          <Input
                            placeholder="Activity name"
                            value={act.activityName}
                            onChange={(e) =>
                              updateActivityField(dayIdx, actIdx, 'activityName', e.target.value)
                            }
                            className="h-9 sm:col-span-4"
                          />
                          <Input
                            placeholder="Location / Spot"
                            value={act.locationName}
                            onChange={(e) =>
                              updateActivityField(dayIdx, actIdx, 'locationName', e.target.value)
                            }
                            className="h-9 sm:col-span-4"
                          />
                          <button
                            type="button"
                            onClick={() => removeActivity(dayIdx, actIdx)}
                            className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md text-lg leading-none text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 sm:static sm:col-span-1 sm:h-9 sm:w-full cursor-pointer"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Images */}
            <ImageUpload
              folder="packages"
              label="Tour Package Photos (Direct Upload)"
              value={formData.imageUrls}
              onChange={(urls) => setFormData({ ...formData, imageUrls: urls.join('\n') })}
              maxFiles={10}
            />

            {/* Visibility Toggles */}
            <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:gap-8">
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className={checkboxClass}
                />
                Published (Visible on Customer Catalog)
              </label>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className={checkboxClass}
                />
                Featured on Homepage
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingPackage ? 'Update Package' : 'Create Package'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(packageToDelete)}
        onOpenChange={(open) => !open && setPackageToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirm Safe Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="font-medium text-foreground">{packageToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Note: Packages with existing departure schedules cannot be deleted to protect active itineraries and booking history.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPackageToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Package Modal */}
      <Dialog
        open={Boolean(rejectModalPkg)}
        onOpenChange={(open) => !open && setRejectModalPkg(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Reject Tour Package
            </DialogTitle>
            <DialogDescription>
              Provide feedback for <strong className="font-medium text-foreground">{rejectModalPkg?.name}</strong> explaining why this package was not approved for publication.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Rejection Reason / Required Adjustments
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
              onClick={() => setRejectModalPkg(null)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRejectPackageConfirm} disabled={isRejecting}>
              {isRejecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" /> Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
