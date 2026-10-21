import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customerApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Users, Plus, Trash2, Edit2, Loader2, HeartHandshake } from 'lucide-react';

export const CoTravelersPage = () => {
  const [coTravelers, setCoTravelers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [fullName, setFullName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [relationship, setRelationship] = useState('Companion');
  const [dietaryOrMedicalNotes, setDietaryOrMedicalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCoTravelers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getCoTravelers();
      setCoTravelers(res.data || []);
    } catch (err) {
      console.error('Fetch co-travelers error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoTravelers();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFullName('');
    setBirthDate('');
    setRelationship('Companion');
    setDietaryOrMedicalNotes('');
    setFormError('');
    setDialogOpen(true);
  };

  const handleOpenEdit = (ct) => {
    setEditingId(ct.id);
    setFullName(ct.fullName || '');
    setBirthDate(ct.birthDate || '');
    setRelationship(ct.relationship || 'Companion');
    setDietaryOrMedicalNotes(ct.dietaryOrMedicalNotes || '');
    setFormError('');
    setDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setFormError('Full name is required.');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      const payload = {
        fullName,
        birthDate,
        relationship,
        dietaryOrMedicalNotes,
      };

      if (editingId) {
        await customerApi.updateCoTraveler(editingId, payload);
      } else {
        await customerApi.createCoTraveler(payload);
      }

      await fetchCoTravelers();
      setDialogOpen(false);
    } catch (err) {
      console.error('Save co-traveler error:', err);
      setFormError(err.message || 'Failed to save companion profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this companion profile?')) return;
    try {
      await customerApi.deleteCoTraveler(id);
      await fetchCoTravelers();
    } catch (err) {
      console.error('Delete co-traveler error:', err);
      alert(err.message || 'Failed to delete companion.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-heading">
            Saved Co-Travelers
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Save family and friends profiles to quickly auto-fill traveler manifests during checkout.
          </p>
        </div>

        <Button onClick={handleOpenAdd} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Co-Traveler
        </Button>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : coTravelers.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 p-12 text-center">
          <HeartHandshake className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No companion profiles saved yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Add frequent companions such as your spouse, children, or friends for instant one-click booking autofill.
          </p>
          <Button onClick={handleOpenAdd} className="mt-4 bg-emerald-600 text-xs">
            Add Your First Companion
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {coTravelers.map((ct) => (
            <Card key={ct.id} className="rounded-2xl border-slate-200 shadow-sm hover:border-slate-300 transition-colors">
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-base">{ct.fullName}</span>
                    <Badge variant="outline" className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border-emerald-200">
                      {ct.relationship || 'Companion'}
                    </Badge>
                  </div>

                  {ct.birthDate && (
                    <p className="text-xs text-slate-500 mb-1">
                      Born: <span className="font-medium text-slate-700">{ct.birthDate}</span>
                    </p>
                  )}

                  {ct.dietaryOrMedicalNotes ? (
                    <div className="mt-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="font-bold text-slate-700">Notes: </span>
                      {ct.dietaryOrMedicalNotes}
                    </div>
                  ) : null}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenEdit(ct)}
                    className="h-8 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    <Edit2 className="h-3.5 w-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(ct.id)}
                    className="h-8 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent onClose={() => setDialogOpen(false)}>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Companion Profile' : 'Add New Co-Traveler'}</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mb-3 rounded-lg bg-red-50 p-3 text-xs text-red-700 border border-red-200 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4 my-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
              <Input
                type="text"
                required
                placeholder="Maria Santos"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-semibold text-slate-700">Birthdate</Label>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700">Relationship</Label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Spouse / Partner">Spouse / Partner</option>
                  <option value="Child / Dependant">Child / Dependant</option>
                  <option value="Parent">Parent</option>
                  <option value="Friend">Friend</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Companion">Other Companion</option>
                </select>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">Dietary or Medical Notes</Label>
              <textarea
                rows={2}
                placeholder="Allergies (e.g. seafood, peanuts), vegetarian, wheelchair assistance, etc."
                value={dietaryOrMedicalNotes}
                onChange={(e) => setDietaryOrMedicalNotes(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-xs font-bold">
                {saving ? 'Saving...' : editingId ? 'Update Companion' : 'Save Companion'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
