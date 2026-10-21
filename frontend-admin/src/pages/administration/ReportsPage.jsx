import React, { useState, useEffect } from 'react';
import { adminApi } from '../../api/adminApi';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
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
  FileSpreadsheet,
  Download,
  Calendar,
  DollarSign,
  Ticket,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const ReportsPage = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Date range filters (default to current month)
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await adminApi.getReports({ startDate, endDate });
      setReportData(res.data || res);
    } catch (err) {
      console.error('[ReportsPage] Error:', err);
      setError(err.message || 'Failed to generate financial report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const formatPHP = (val) =>
    new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      maximumFractionDigits: 0,
    }).format(val || 0);

  // Download CSV
  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const response = await axiosClient.get('/admin/reports', {
        params: {
          startDate,
          endDate,
          format: 'csv',
        },
        responseType: 'blob',
      });

      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lakbay-financial-report-${startDate}-to-${endDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('[ExportCSV] Error:', err);
      alert('Failed to download CSV: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const bookings = reportData?.bookings || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Financial & Operational Reports
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Audit realized booking revenues, filter by departure timeline, and export official CSV statements.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={handleExportCSV}
            disabled={exporting || bookings.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Generating CSV...' : 'Export to CSV'}
          </Button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="start-date" className="text-xs font-semibold text-slate-600">
              From:
            </Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="end-date" className="text-xs font-semibold text-slate-600">
              To:
            </Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-40 text-xs"
            />
          </div>

          <Button
            onClick={fetchReport}
            size="sm"
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs h-9"
          >
            Filter Dates
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={fetchReport}
          className="text-slate-500 hover:text-slate-800"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Verified Revenue in Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-700">
              {formatPHP(reportData?.totalCollected)}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Paid bookings scheduled in selected dates
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Booking Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-slate-900">
              {reportData?.recordCount || 0}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Total reservations matching date query
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Format Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50">
                UTF-8 CSV
              </Badge>
              <Badge variant="outline" className="text-blue-700 border-blue-300 bg-blue-50">
                Real-time JSON
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Compatible with Microsoft Excel & Google Sheets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ref Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Departure Date</TableHead>
              <TableHead>Travelers</TableHead>
              <TableHead>Gross PHP</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Booking Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                  <RefreshCw className="mx-auto h-6 w-6 animate-spin text-emerald-600 mb-2" />
                  Generating report preview...
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-slate-400">
                  No reservations found within the selected departure dates.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono font-bold text-xs text-slate-900">
                    {b.bookingReference}
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-slate-800 text-xs">{b.customerName}</div>
                    <div className="text-[11px] text-slate-400">{b.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700 font-medium">
                    {b.packageName}
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">
                    {b.departureDate}
                  </TableCell>
                  <TableCell className="text-xs text-slate-800 font-medium">
                    {b.numberOfTravelers || 1}
                  </TableCell>
                  <TableCell className="text-xs font-bold text-slate-900">
                    {formatPHP(b.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={b.paymentStatus === 'Paid' ? 'success' : 'secondary'}
                      className="text-[10px] px-1.5 py-0"
                    >
                      {b.paymentStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        b.bookingStatus === 'Confirmed'
                          ? 'success'
                          : b.bookingStatus === 'Completed'
                          ? 'info'
                          : 'outline'
                      }
                      className="text-[10px] px-1.5 py-0"
                    >
                      {b.bookingStatus}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
