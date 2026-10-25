import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
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
  MapPin,
  RefreshCw,
  LocateFixed,
  AlertCircle,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';

const CATEGORIES = ['Island', 'Beach', 'Mountain', 'Cultural', 'Heritage', 'Nature', 'Urban'];
const REGIONS = ['Luzon', 'Visayas', 'Mindanao', 'MIMAROPA', 'Bicol', 'Cordillera', 'Central Visayas', 'Caraga'];

const fieldClass =
  'w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-slate-400 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20';

const checkboxClass = 'h-4 w-4 shrink-0 rounded border-slate-300 accent-primary cursor-pointer';

export const DestinationsManagePage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [destinationToDelete, setDestinationToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    country: 'Philippines',
    region: 'Visayas',
    location: '',
    category: 'Island',
    description: '',
    lat: '',
    lng: '',
    recommendedActivities: '',
    imageUrls: '',
    isPublished: true,
    isFeatured: false,
  });
  const [geocoding, setGeocoding] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchDestinations = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getDestinations();
      setDestinations(res.data || res || []);
    } catch (err) {
      console.error('[DestinationsManagePage] Fetch error:', err);
      setError(err.message || 'Failed to load destinations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const openCreateModal = () => {
    setEditingDestination(null);
    setFormData({
      name: '',
      country: 'Philippines',
      region: 'Visayas',
      location: '',
      category: 'Island',
      description: '',
      lat: '',
      lng: '',
      recommendedActivities: '',
      imageUrls: '',
      isPublished: true,
      isFeatured: false,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (dest) => {
    setEditingDestination(dest);
    setFormData({
      name: dest.name || '',
      country: dest.country || 'Philippines',
      region: dest.region || 'Visayas',
      location: dest.location || '',
      category: dest.category || 'Island',
      description: dest.description || '',
      lat: dest.coordinates?.lat?.toString() || '',
      lng: dest.coordinates?.lng?.toString() || '',
      recommendedActivities: (dest.recommendedActivities || []).join(', '),
      imageUrls: (dest.imageUrls || []).join('\n'),
      isPublished: Boolean(dest.isPublished),
      isFeatured: Boolean(dest.isFeatured),
    });
    setIsModalOpen(true);
  };

  // Geoapify Geocoding
  const handleAutoGeocode = async () => {
    if (!formData.name && !formData.location) {
      alert('Please enter at least a Destination Name or Location to auto-geocode.');
      return;
    }
    try {
      setGeocoding(true);
      const query = `${formData.name}, ${formData.location || formData.region}, Philippines`;
      const res = await adminApi.geocodeLocation(query);
      const coords = res.data || res;
      if (coords?.lat && coords?.lng) {
        setFormData((prev) => ({
          ...prev,
          lat: coords.lat.toString(),
          lng: coords.lng.toString(),
        }));
      } else {
        alert('Could not resolve coordinates for this query. You may enter them manually.');
      }
    } catch (err) {
      console.error('[AutoGeocode] Error:', err);
      alert('Geocoding service error: ' + err.message);
    } finally {
      setGeocoding(false);
    }
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Destination name is required.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        country: formData.country.trim(),
        region: formData.region.trim(),
        location: formData.location.trim(),
        category: formData.category,
        description: formData.description,
        coordinates: {
          lat: parseFloat(formData.lat) || 12.8797,
          lng: parseFloat(formData.lng) || 121.774,
        },
        recommendedActivities: formData.recommendedActivities
          .split(',')
          .map((a) => a.trim())
          .filter(Boolean),
        imageUrls: formData.imageUrls
          .split('\n')
          .map((url) => url.trim())
          .filter(Boolean),
        isPublished: formData.isPublished,
        isFeatured: formData.isFeatured,
      };

      if (editingDestination) {
        await adminApi.updateDestination(editingDestination.id, payload);
      } else {
        await adminApi.createDestination(payload);
      }

      setIsModalOpen(false);
      fetchDestinations();
    } catch (err) {
      console.error('[SaveDestination] Error:', err);
      alert(err.message || 'Failed to save destination.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Toggle Published
  const handleTogglePublish = async (dest) => {
    try {
      const updated = !dest.isPublished;
      await adminApi.updateDestination(dest.id, { isPublished: updated });
      setDestinations((prev) =>
        prev.map((d) => (d.id === dest.id ? { ...d, isPublished: updated } : d))
      );
    } catch (err) {
      alert('Failed to update published status: ' + err.message);
    }
  };

  // Delete Destination Guard
  const confirmDelete = async () => {
    if (!destinationToDelete) return;
    try {
      setIsDeleting(true);
      setDeleteError('');
      await adminApi.deleteDestination(destinationToDelete.id);
      setDestinationToDelete(null);
      fetchDestinations();
    } catch (err) {
      console.error('[DeleteDestination] Error:', err);
      setDeleteError(err.message || 'Failed to delete destination.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered List
  const filtered = destinations.filter((dest) => {
    const matchesSearch =
      !search ||
      dest.name?.toLowerCase().includes(search.toLowerCase()) ||
      dest.location?.toLowerCase().includes(search.toLowerCase()) ||
      dest.region?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !categoryFilter || dest.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Destinations Catalog
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure Philippine travel hubs, GPS geo-coordinates, and publication visibility.
          </p>
        </div>
        <Button onClick={openCreateModal} className="w-full shrink-0 sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Destination
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search destination, region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className={`${fieldClass} h-10 flex-1 sm:w-48 sm:flex-none`}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchDestinations}
            className="h-10 w-10 shrink-0 text-slate-500"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Destinations Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[88px]">Preview</TableHead>
              <TableHead>Destination Name</TableHead>
              <TableHead>Region & Location</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Coordinates</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Loading destinations...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-muted-foreground">
                  No destinations found matching your filters.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((dest) => (
                <TableRow key={dest.id}>
                  <TableCell>
                    {dest.imageUrls?.[0] ? (
                      <img
                        src={dest.imageUrls[0]}
                        alt={dest.name}
                        className="h-11 w-14 rounded-md border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-11 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{dest.name}</span>
                      {dest.isFeatured && <Badge variant="warning">Featured</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-slate-700">{dest.region}</div>
                    <div className="text-xs text-muted-foreground">{dest.location}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{dest.category}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                    {dest.coordinates?.lat?.toFixed(4)}, {dest.coordinates?.lng?.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(dest)}
                      className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      title="Click to toggle publish status"
                    >
                      {dest.isPublished ? (
                        <Badge variant="success">
                          <Check className="h-3 w-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          Draft (Hidden)
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(dest)}
                        className="h-8 w-8 text-slate-500 hover:text-foreground"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDestinationToDelete(dest);
                          setDeleteError('');
                        }}
                        className="h-8 w-8 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Modal Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingDestination ? 'Edit Destination' : 'Add New Destination'}
            </DialogTitle>
            <DialogDescription>
              Configure destination coordinates, geographical tags, and recommended activities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dest-name">Destination Name *</Label>
                <Input
                  id="dest-name"
                  placeholder="e.g. El Nido, Palawan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dest-category">Category</Label>
                <select
                  id="dest-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className={`${fieldClass} h-10`}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dest-region">Region</Label>
                <select
                  id="dest-region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className={`${fieldClass} h-10`}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dest-location">Location Specifics</Label>
                <Input
                  id="dest-location"
                  placeholder="e.g. Palawan, Philippines"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Geoapify Coordinates Section */}
            <div className="space-y-3 rounded-md border border-border bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <LocateFixed className="h-4 w-4 text-slate-400" />
                  GPS Coordinates (Geoapify Proxy)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoGeocode}
                  disabled={geocoding}
                  className="w-full sm:w-auto"
                >
                  {geocoding ? 'Geocoding...' : 'Auto-Detect via Geoapify'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dest-lat" className="text-xs text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    id="dest-lat"
                    type="number"
                    step="any"
                    placeholder="11.1956"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                    className="font-mono tabular-nums"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dest-lng" className="text-xs text-muted-foreground">
                    Longitude
                  </Label>
                  <Input
                    id="dest-lng"
                    type="number"
                    step="any"
                    placeholder="119.4075"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                    className="font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dest-desc">Overview & Description</Label>
              <textarea
                id="dest-desc"
                rows={3}
                placeholder="Highlight attractions, natural beauty, cultural history..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`${fieldClass} resize-y`}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dest-activities">Recommended Activities (Comma-separated)</Label>
              <Input
                id="dest-activities"
                placeholder="Island Hopping, Scuba Diving, Sunset Trekking"
                value={formData.recommendedActivities}
                onChange={(e) =>
                  setFormData({ ...formData, recommendedActivities: e.target.value })
                }
              />
            </div>

            <ImageUpload
              folder="destinations"
              label="Destination Photos (Direct Upload)"
              value={formData.imageUrls}
              onChange={(urls) => setFormData({ ...formData, imageUrls: urls.join('\n') })}
              maxFiles={6}
            />

            {/* Visibility Toggles */}
            <div className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-center sm:gap-8">
              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className={checkboxClass}
                />
                Published (Visible on Customer Catalog)
              </label>

              <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className={checkboxClass}
                />
                Featured on Homepage
              </label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingDestination ? 'Update Destination' : 'Create Destination'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={Boolean(destinationToDelete)}
        onOpenChange={(open) => !open && setDestinationToDelete(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Confirm Safe Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong className="font-medium text-foreground">{destinationToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{deleteError}</span>
            </div>
          )}

          <p className="rounded-md bg-slate-50 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Note: Lakbay prevents deleting destinations that have existing tour packages assigned to prevent broken reservations.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDestinationToDelete(null)}
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
    </div>
  );
};
