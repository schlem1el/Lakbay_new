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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Destinations Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure Philippine travel hubs, GPS geo-coordinates, and publication visibility.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={openCreateModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Add Destination
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search destination, region..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDestinations}
            className="text-slate-500 hover:text-slate-800"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Destinations Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Preview</TableHead>
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
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  Loading destinations...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-slate-400">
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
                        className="h-10 w-12 rounded object-cover border border-slate-200"
                      />
                    ) : (
                      <div className="flex h-10 w-12 items-center justify-center rounded bg-slate-100 text-slate-400">
                        <MapPin className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{dest.name}</span>
                      {dest.isFeatured && (
                        <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                          Featured
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    <div>{dest.region}</div>
                    <div className="text-xs text-slate-400">{dest.location}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">
                      {dest.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-slate-500">
                    {dest.coordinates?.lat?.toFixed(4)}, {dest.coordinates?.lng?.toFixed(4)}
                  </TableCell>
                  <TableCell>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(dest)}
                      className="cursor-pointer"
                      title="Click to toggle publish status"
                    >
                      {dest.isPublished ? (
                        <Badge variant="success" className="flex items-center gap-1">
                          <Check className="h-3 w-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-400 border-slate-300">
                          Draft (Hidden)
                        </Badge>
                      )}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(dest)}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-emerald-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDestinationToDelete(dest);
                          setDeleteError('');
                        }}
                        className="h-8 w-8 p-0 text-slate-600 hover:text-red-600"
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDestination ? 'Edit Destination' : 'Add New Destination'}
            </DialogTitle>
            <DialogDescription>
              Configure destination coordinates, geographical tags, and recommended activities.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dest-name" className="text-xs font-semibold">
                  Destination Name *
                </Label>
                <Input
                  id="dest-name"
                  placeholder="e.g. El Nido, Palawan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dest-category" className="text-xs font-semibold">
                  Category
                </Label>
                <select
                  id="dest-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="dest-region" className="text-xs font-semibold">
                  Region
                </Label>
                <select
                  id="dest-region"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dest-location" className="text-xs font-semibold">
                  Location Specifics
                </Label>
                <Input
                  id="dest-location"
                  placeholder="e.g. Palawan, Philippines"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>

            {/* Geoapify Coordinates Section */}
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <LocateFixed className="h-3.5 w-3.5 text-emerald-600" />
                  GPS Coordinates (Geoapify Proxy)
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAutoGeocode}
                  disabled={geocoding}
                  className="h-7 text-xs bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  {geocoding ? 'Geocoding...' : 'Auto-Detect via Geoapify'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="dest-lat" className="text-[11px] text-slate-500">
                    Latitude
                  </Label>
                  <Input
                    id="dest-lat"
                    type="number"
                    step="any"
                    placeholder="11.1956"
                    value={formData.lat}
                    onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dest-lng" className="text-[11px] text-slate-500">
                    Longitude
                  </Label>
                  <Input
                    id="dest-lng"
                    type="number"
                    step="any"
                    placeholder="119.4075"
                    value={formData.lng}
                    onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dest-desc" className="text-xs font-semibold">
                Overview & Description
              </Label>
              <textarea
                id="dest-desc"
                rows={3}
                placeholder="Highlight attractions, natural beauty, cultural history..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dest-activities" className="text-xs font-semibold">
                Recommended Activities (Comma-separated)
              </Label>
              <Input
                id="dest-activities"
                placeholder="Island Hopping, Scuba Diving, Sunset Trekking"
                value={formData.recommendedActivities}
                onChange={(e) =>
                  setFormData({ ...formData, recommendedActivities: e.target.value })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dest-images" className="text-xs font-semibold">
                Image URLs (One per line)
              </Label>
              <textarea
                id="dest-images"
                rows={2}
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrls}
                onChange={(e) => setFormData({ ...formData, imageUrls: e.target.value })}
                className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Visibility Toggles */}
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Published (Visible on Customer Catalog)
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.isFeatured}
                  onChange={(e) =>
                    setFormData({ ...formData, isFeatured: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Featured on Homepage
              </label>
            </div>

            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
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
            <DialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Confirm Safe Deletion
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete{' '}
              <strong>{destinationToDelete?.name}</strong>?
            </DialogDescription>
          </DialogHeader>

          {deleteError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {deleteError}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Note: Lakbay prevents deleting destinations that have existing tour packages assigned to prevent broken reservations.
          </p>

          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setDestinationToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
