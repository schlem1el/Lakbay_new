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
  Sparkles,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  ExternalLink,
  Megaphone,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Percent,
} from 'lucide-react';

export const PromotionsManagePage = () => {
  const { role } = useStaffAuth();
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [saving, setSaving] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    badgeText: 'SPECIAL OFFER',
    discountHighlight: 'Save up to 25%',
    actionUrl: '/packages?discounted=true',
    actionLabel: 'Explore Deals',
    imageUrl: '',
    isPublished: true,
  });

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getPromotions();
      setPromotions(res.data || res || []);
    } catch (err) {
      console.error('[PromotionsManagePage] Fetch error:', err);
      setError(err.message || 'Failed to load promotional campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const openCreateModal = () => {
    setEditingPromo(null);
    setFormData({
      title: '',
      subtitle: '',
      badgeText: 'SUMMER SPECIAL',
      discountHighlight: 'Direct discounts up to 30%',
      actionUrl: '/packages?discounted=true',
      actionLabel: 'View Discounted Tours',
      imageUrl: '',
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setFormData({
      title: promo.title || '',
      subtitle: promo.subtitle || '',
      badgeText: promo.badgeText || 'SPECIAL OFFER',
      discountHighlight: promo.discountHighlight || '',
      actionUrl: promo.actionUrl || '/packages?discounted=true',
      actionLabel: promo.actionLabel || 'Explore Deals',
      imageUrl: promo.imageUrl || '',
      isPublished: Boolean(promo.isPublished),
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Campaign title is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        badgeText: formData.badgeText.trim() || 'PROMOTION',
        discountHighlight: formData.discountHighlight.trim(),
        actionUrl: formData.actionUrl.trim() || '/packages?discounted=true',
        actionLabel: formData.actionLabel.trim() || 'Explore Deals',
        imageUrl: formData.imageUrl.trim(),
        isPublished: formData.isPublished,
      };

      if (editingPromo) {
        await adminApi.updatePromotion(editingPromo.id, payload);
      } else {
        await adminApi.createPromotion(payload);
      }

      setIsModalOpen(false);
      fetchPromotions();
    } catch (err) {
      console.error('[SavePromotion] Error:', err);
      alert(err.message || 'Failed to save promotional campaign.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (promo) => {
    try {
      await adminApi.togglePromotion(promo.id);
      setPromotions((prev) =>
        prev.map((p) => (p.id === promo.id ? { ...p, isPublished: !p.isPublished } : p))
      );
    } catch (err) {
      alert('Failed to update published status: ' + err.message);
    }
  };

  const handleDelete = async () => {
    if (!promoToDelete) return;
    try {
      setIsDeleting(true);
      await adminApi.deletePromotion(promoToDelete.id);
      setPromoToDelete(null);
      fetchPromotions();
    } catch (err) {
      alert('Failed to delete promotion: ' + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = promotions.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.subtitle?.toLowerCase().includes(q) ||
      p.badgeText?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Promotions & Campaigns</h1>
            <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
              Direct Discounts
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Publish customer-facing promotional campaign ribbons and deal banners across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={fetchPromotions}
            disabled={loading}
            className="flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {['admin', 'coordinator'].includes(role) && (
            <Button
              onClick={openCreateModal}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              New Campaign Banner
            </Button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search campaigns by title or tag..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Campaign Banners Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/80">
              <TableHead className="w-24">Banner</TableHead>
              <TableHead>Campaign Details</TableHead>
              <TableHead>Discount / Badge</TableHead>
              <TableHead>Destination Link</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  Loading promotional campaigns...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center text-slate-400">
                  No promotional campaigns found. Create your first campaign banner to showcase special offers!
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((promo) => (
                <TableRow key={promo.id}>
                  <TableCell>
                    {promo.imageUrl ? (
                      <img
                        src={promo.imageUrl}
                        alt={promo.title}
                        className="h-12 w-20 rounded-md object-cover border border-slate-200 shadow-xs"
                      />
                    ) : (
                      <div className="flex h-12 w-20 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <Megaphone className="h-5 w-5" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-900">{promo.title}</div>
                    {promo.subtitle && (
                      <div className="text-xs text-slate-500 line-clamp-1">{promo.subtitle}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 items-start">
                      {promo.badgeText && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-200 text-[10px] font-bold">
                          {promo.badgeText}
                        </Badge>
                      )}
                      {promo.discountHighlight && (
                        <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {promo.discountHighlight}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded">
                      {promo.actionUrl || '/packages'}
                      <ExternalLink className="h-3 w-3 text-slate-400" />
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(promo)}
                      className="cursor-pointer"
                      title="Click to toggle live publication"
                    >
                      {promo.isPublished ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> Live
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-300">
                          Draft (Hidden)
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(promo)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-700 cursor-pointer"
                        title="Edit campaign"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {role === 'admin' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPromoToDelete(promo)}
                          className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 cursor-pointer"
                          title="Delete campaign"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              {editingPromo ? 'Edit Promotional Campaign' : 'Create Promotional Campaign'}
            </DialogTitle>
            <DialogDescription>
              Configure the banner text, discount highlight tag, and promotional destination link.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="promo-title" className="text-xs font-semibold">
                Campaign Headline *
              </Label>
              <Input
                id="promo-title"
                placeholder="e.g. Summer Island Flash Sale"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="promo-subtitle" className="text-xs font-semibold">
                Subtitle / Description
              </Label>
              <Input
                id="promo-subtitle"
                placeholder="e.g. Book selected Palawan and Boracay tours at exclusive direct rates."
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="promo-badge" className="text-xs font-semibold">
                  Badge Tag
                </Label>
                <Input
                  id="promo-badge"
                  placeholder="e.g. 20% OFF or LIMITED DEAL"
                  value={formData.badgeText}
                  onChange={(e) => setFormData({ ...formData, badgeText: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo-highlight" className="text-xs font-semibold">
                  Discount Highlight Text
                </Label>
                <Input
                  id="promo-highlight"
                  placeholder="e.g. Up to 25% Instant Savings"
                  value={formData.discountHighlight}
                  onChange={(e) => setFormData({ ...formData, discountHighlight: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="promo-url" className="text-xs font-semibold">
                  Action Link URL
                </Label>
                <Input
                  id="promo-url"
                  placeholder="/packages?discounted=true"
                  value={formData.actionUrl}
                  onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="promo-btn" className="text-xs font-semibold">
                  Button Call-to-Action
                </Label>
                <Input
                  id="promo-btn"
                  placeholder="e.g. View Discounted Tours"
                  value={formData.actionLabel}
                  onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                />
              </div>
            </div>

            {/* Banner Image Upload */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Campaign Banner Image</Label>
              <ImageUpload
                folder="promotions"
                images={formData.imageUrl ? [formData.imageUrl] : []}
                onChange={(urls) => setFormData({ ...formData, imageUrl: urls[0] || '' })}
                maxFiles={1}
              />
            </div>

            {/* Published Switch */}
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="promo-published"
                checked={formData.isPublished}
                onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <Label htmlFor="promo-published" className="text-sm font-medium text-slate-700 cursor-pointer">
                Publish immediately to customer homepages and package ribbons
              </Label>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingPromo ? (
                  'Update Campaign'
                ) : (
                  'Create Campaign'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={Boolean(promoToDelete)} onOpenChange={() => setPromoToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Delete Promotional Campaign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete "{promoToDelete?.title}"? This campaign banner will no longer be visible to travelers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setPromoToDelete(null)}
              disabled={isDeleting}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
