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
        <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
        <span className="text-sm text-muted-foreground">
          Loading assigned tour departures...
        </span>
      </div>
    );
  }

  const weather = selectedDeparture?.destinationWeather;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <Compass className="h-6 w-6 shrink-0 text-primary" />
            Tour Guide Operations & Manifest
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time passenger roster, digital roll-call check-ins, destination weather advisory, and trip completion.
          </p>
        </div>
        <Button variant="outline" onClick={fetchDepartures} className="w-full shrink-0 sm:w-auto">
          <RefreshCw className="h-4 w-4" />
          Refresh Assignments
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Departure Selector Pills */}
      {assignedDepartures.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-slate-100">
            <Compass className="h-5 w-5 text-slate-400" />
          </div>
          <h3 className="text-sm font-medium text-foreground">No Assigned Departures</h3>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            You currently have no active tour departures assigned to your guide account.
          </p>
        </div>
      ) : (
        <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {assignedDepartures.map((dep) => {
            const isSelected = selectedDeparture?.id === dep.id;
            return (
              <button
                key={dep.id}
                type="button"
                onClick={() => selectDeparture(dep)}
                aria-pressed={isSelected}
                className={`flex w-64 shrink-0 snap-start flex-col rounded-lg border p-4 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  isSelected
                    ? 'border-primary bg-card ring-1 ring-primary'
                    : 'border-border bg-card hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="line-clamp-2 text-sm font-medium text-foreground">
                    {dep.package?.name || 'Tour Package'}
                  </span>
                  <Badge
                    variant={dep.status === 'completed' ? 'secondary' : 'success'}
                    className="shrink-0 capitalize"
                  >
                    {dep.status}
                  </Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 tabular-nums text-slate-700">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {dep.departureDate}
                  </span>
                  <span className="text-slate-300">&bull;</span>
                  <span className="tabular-nums">{dep.bookedCount || 0} Guests</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Selected Departure Dossier & Live Weather */}
      {selectedDeparture && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-6">
          {/* Main Departure Card */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-1">
                <CardTitle className="text-lg">
                  {selectedDeparture.package?.name}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="tabular-nums">Schedule: {selectedDeparture.departureDate} to {selectedDeparture.returnDate}</span>
                  <span className="text-slate-300">&bull;</span>
                  <span>{selectedDeparture.package?.durationDays || 1} Days Tour</span>
                </CardDescription>
              </div>

              {selectedDeparture.status !== 'completed' && (
                <Button
                  onClick={handleCompleteDeparture}
                  disabled={completing}
                  className="w-full shrink-0 sm:w-auto"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {completing ? 'Completing...' : 'Mark Tour as Completed'}
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {/* Headcount and Check-in Bar */}
              <div className="space-y-2.5 rounded-md border border-border bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-slate-600">Digital Roll-Call Progress</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {manifestData?.checkedInHeadcount || 0} of {manifestData?.totalHeadcount || 0} Checked In
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
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
          <Card>
            <CardHeader className="pb-3 sm:pb-3">
              <CardTitle className="flex items-center gap-2 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                <CloudSun className="h-4 w-4 text-sky-500" />
                Live Destination Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weather ? (
                <div className="space-y-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
                      {Math.round(weather.temp || weather.temperature || 29)}°C
                    </span>
                    <span className="text-sm capitalize text-slate-600">
                      {weather.condition || weather.description || 'Clear Sky'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                    <div>Humidity: <span className="font-medium tabular-nums text-foreground">{weather.humidity || 75}%</span></div>
                    <div>Wind: <span className="font-medium tabular-nums text-foreground">{weather.windSpeed || 12} km/h</span></div>
                  </div>
                  <p className="text-xs text-emerald-700">
                    Ideal conditions for scheduled outdoor group activities.
                  </p>
                </div>
              ) : (
                <div className="py-4 text-center text-sm text-muted-foreground">
                  Live destination meteorological data unavailable.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Passenger Manifest Table */}
      {selectedDeparture && (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-1 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-slate-400" />
              Verified Passenger Manifest ({manifestData?.totalHeadcount || 0} Travelers)
            </h3>
            <span className="text-xs text-muted-foreground">
              Click checkbox to toggle boarding check-in status
            </span>
          </div>

          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[88px] text-center">Check-In</TableHead>
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
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                    Loading traveler roster...
                  </TableCell>
                </TableRow>
              ) : !manifestData?.manifest || manifestData.manifest.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    No confirmed passenger reservations for this departure yet.
                  </TableCell>
                </TableRow>
              ) : (
                manifestData.manifest.map((item, idx) => (
                  <TableRow
                    key={`${item.bookingId}-${item.travelerIndex}`}
                    className={item.isCheckedIn ? 'bg-emerald-50/40 hover:bg-emerald-50/60' : ''}
                  >
                    <TableCell className="text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleCheckIn(item)}
                        aria-pressed={item.isCheckedIn}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                      >
                        {item.isCheckedIn ? (
                          <CheckSquare className="h-5 w-5 text-primary" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{item.fullName}</span>
                        {item.isCheckedIn && <Badge variant="success">Boarded</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {item.relationship}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-slate-800">
                      {item.bookingReference}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 whitespace-nowrap tabular-nums text-slate-700">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.contactPhone || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.dietaryOrMedicalNotes ? (
                        <Badge variant="warning" className="whitespace-normal">
                          {item.dietaryOrMedicalNotes}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">None noted</span>
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
