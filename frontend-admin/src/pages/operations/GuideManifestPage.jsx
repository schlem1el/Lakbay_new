import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import { useStaffAuth } from '../../contexts/StaffAuthContext';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../../components/ui/table';
import {
  Compass,
  Calendar,
  Users,
  CheckCircle2,
  CloudSun,
  CheckSquare,
  Square,
  RefreshCw,
  AlertCircle,
  Phone,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';

export const GuideManifestPage = () => {
  const { user, role } = useStaffAuth();

  const [assignedDepartures, setAssignedDepartures] = useState([]);
  const [selectedDeparture, setSelectedDeparture] = useState(null);
  const [manifestData, setManifestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingManifest, setLoadingManifest] = useState(false);
  const [error, setError] = useState('');
  const [completing, setCompleting] = useState(false);

  // Fetch assigned departures
  const fetchDepartures = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getAssignedDepartures();
      const deps = res.data || res || [];
      setAssignedDepartures(deps);

      if (deps.length > 0 && !selectedDeparture) {
        selectDeparture(deps[0]);
      }
    } catch (err) {
      console.error('[GuideManifestPage] Error:', err);
      setError(err.message || 'Failed to load assigned departures.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch manifest for a departure
  const selectDeparture = async (dep) => {
    setSelectedDeparture(dep);
    try {
      setLoadingManifest(true);
      const res = await adminApi.getDepartureManifest(dep.id);
      setManifestData(res.data || res);
    } catch (err) {
      console.error('[ManifestFetch] Error:', err);
      alert(err.message || 'Failed to load manifest for selected departure.');
    } finally {
      setLoadingManifest(false);
    }
  };

  useEffect(() => {
    fetchDepartures();
  }, []);

  // Check-in toggle
  const handleToggleCheckIn = async (item) => {
    if (!selectedDeparture) return;
    const newStatus = !item.isCheckedIn;

    try {
      // Optimistic update
      setManifestData((prev) => {
        if (!prev) return prev;
        const updatedList = prev.manifest.map((m) =>
          m.bookingId === item.bookingId && m.travelerIndex === item.travelerIndex
            ? { ...m, isCheckedIn: newStatus }
            : m
        );
        const newCheckedInCount = updatedList.filter((m) => m.isCheckedIn).length;
        return {
          ...prev,
          checkedInHeadcount: newCheckedInCount,
          manifest: updatedList,
        };
      });

      await adminApi.updatePassengerCheckIn(selectedDeparture.id, {
        bookingId: item.bookingId,
        travelerIndex: item.travelerIndex,
        isCheckedIn: newStatus,
      });
    } catch (err) {
      console.error('[CheckInToggle] Error:', err);
      alert('Failed to update passenger check-in status: ' + err.message);
      selectDeparture(selectedDeparture); // rollback
    }
  };

  // Mark Departure as Complete
  const handleCompleteDeparture = async () => {
    if (!selectedDeparture) return;
    const confirmed = window.confirm(
      `Are you sure you want to mark this tour (${selectedDeparture.package?.name || 'Tour'}) as COMPLETED? All confirmed bookings will be marked as Completed.`
    );
    if (!confirmed) return;

    try {
      setCompleting(true);
      await adminApi.completeDeparture(selectedDeparture.id);
      alert('Tour departure successfully finalized and marked as Completed!');
      fetchDepartures();
    } catch (err) {
      console.error('[CompleteDeparture] Error:', err);
      alert(err.message || 'Failed to complete departure.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3">
        <RefreshCw className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-sm font-medium text-slate-500">
          Loading assigned tour departures...
        </span>
      </div>
    );
  }

  const weather = selectedDeparture?.destinationWeather;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Compass className="h-6 w-6 text-emerald-600" />
            Tour Guide Operations & Manifest
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time passenger roster, digital roll-call check-ins, destination weather advisory, and trip completion.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchDepartures}
          className="text-xs text-slate-600 flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Assignments
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Departure Selector Pills */}
      {assignedDepartures.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          <Compass className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <h3 className="font-semibold text-slate-700">No Assigned Departures</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            You currently have no active tour departures assigned to your guide account.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {assignedDepartures.map((dep) => {
            const isSelected = selectedDeparture?.id === dep.id;
            return (
              <button
                key={dep.id}
                type="button"
                onClick={() => selectDeparture(dep)}
                className={`flex shrink-0 flex-col rounded-xl border p-3.5 text-left transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-bold text-slate-900">
                    {dep.package?.name || 'Tour Package'}
                  </span>
                  <Badge
                    variant={dep.status === 'completed' ? 'secondary' : 'success'}
                    className="text-[10px] uppercase font-bold"
                  >
                    {dep.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <Calendar className="h-3 w-3 text-slate-400" />
                    {dep.departureDate}
                  </span>
                  <span>&bull;</span>
                  <span>{dep.bookedCount || 0} Guests</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Departure Dossier & Live Weather */}
      {selectedDeparture && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main Departure Card */}
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  {selectedDeparture.package?.name}
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                  <span>Schedule: {selectedDeparture.departureDate} to {selectedDeparture.returnDate}</span>
                  <span>&bull;</span>
                  <span>{selectedDeparture.package?.durationDays || 1} Days Tour</span>
                </CardDescription>
              </div>

              {selectedDeparture.status !== 'completed' && (
                <Button
                  onClick={handleCompleteDeparture}
                  disabled={completing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {completing ? 'Completing...' : 'Mark Tour as Completed'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Headcount and Check-in Bar */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-600">Digital Roll-Call Progress</span>
                  <span className="text-emerald-700">
                    {manifestData?.checkedInHeadcount || 0} of {manifestData?.totalHeadcount || 0} Checked In
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{
                      width: `${
                        manifestData?.totalHeadcount
                          ? Math.round(
                              (manifestData.checkedInHeadcount / manifestData.totalHeadcount) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Destination Weather Preview Card */}
          <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <CloudSun className="h-4 w-4 text-blue-500" />
                Live Destination Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weather ? (
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-slate-900">
                      {Math.round(weather.temp || weather.temperature || 29)}°C
                    </span>
                    <span className="text-xs font-semibold text-slate-600 capitalize">
                      {weather.condition || weather.description || 'Clear Sky'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 pt-1 border-t border-slate-100">
                    <div>Humidity: <span className="font-semibold text-slate-700">{weather.humidity || 75}%</span></div>
                    <div>Wind: <span className="font-semibold text-slate-700">{weather.windSpeed || 12} km/h</span></div>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium pt-1">
                    Ideal conditions for scheduled outdoor group activities.
                  </p>
                </div>
              ) : (
                <div className="py-4 text-xs text-slate-400 text-center">
                  Live destination meteorological data unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passenger Manifest Table */}
      {selectedDeparture && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 bg-slate-50/50 px-6 py-3.5 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-600" />
              Verified Passenger Manifest ({manifestData?.totalHeadcount || 0} Travelers)
            </h3>
            <span className="text-xs text-slate-500">
              Click checkbox to toggle boarding check-in status
            </span>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px] text-center">Check-In</TableHead>
                <TableHead>Traveler Name</TableHead>
                <TableHead>Party / Role</TableHead>
                <TableHead>Booking Ref</TableHead>
                <TableHead>Emergency Phone</TableHead>
                <TableHead>Dietary & Medical Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingManifest ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                    Loading traveler roster...
                  </TableCell>
                </TableRow>
              ) : !manifestData?.manifest || manifestData.manifest.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                    No confirmed passenger reservations for this departure yet.
                  </TableCell>
                </TableRow>
              ) : (
                manifestData.manifest.map((item, idx) => (
                  <TableRow
                    key={`${item.bookingId}-${item.travelerIndex}`}
                    className={item.isCheckedIn ? 'bg-emerald-50/30' : ''}
                  >
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCheckIn(item)}
                        className="cursor-pointer text-slate-400 hover:text-emerald-600 focus:outline-none"
                      >
                        {item.isCheckedIn ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600 inline" />
                        ) : (
                          <Square className="h-5 w-5 inline" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{item.fullName}</span>
                        {item.isCheckedIn && (
                          <Badge variant="success" className="text-[9px] px-1.5 py-0">
                            Boarded
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {item.relationship}
                    </TableCell>
                    <TableCell className="font-mono text-xs font-semibold text-slate-800">
                      {item.bookingReference}
                    </TableCell>
                    <TableCell className="text-xs text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-slate-400" />
                        <span>{item.contactPhone || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {item.dietaryOrMedicalNotes ? (
                        <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          {item.dietaryOrMedicalNotes}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">None noted</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
