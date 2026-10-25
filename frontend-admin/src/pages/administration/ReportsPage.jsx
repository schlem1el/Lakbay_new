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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            <FileSpreadsheet className="h-6 w-6 shrink-0 text-primary" />
            Financial & Operational Reports
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Audit realized booking revenues, filter by departure timeline, and export official CSV statements.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={exporting || bookings.length === 0}
          className="w-full shrink-0 sm:w-auto"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Generating CSV...' : 'Export to CSV'}
        </Button>
      </div>

      {/* Date Filter Bar */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                From:
              </Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="sm:w-44"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                To:
              </Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="sm:w-44"
              />
            </div>
          </div>

          <div className="flex gap-2 sm:flex-1 sm:justify-between">
            <Button onClick={fetchReport} variant="outline" className="flex-1 sm:flex-none">
              Filter Dates
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={fetchReport}
              className="h-10 w-10 text-slate-500"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Verified Revenue in Window
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
              {formatPHP(reportData?.totalCollected)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Paid bookings scheduled in selected dates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Booking Volume
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-heading text-[2.5rem] font-normal leading-none tracking-normal tabular-nums text-foreground">
              {reportData?.recordCount || 0}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total reservations matching date query
            </p>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-2">
            <CardTitle className="font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Format Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Badge variant="success">UTF-8 CSV</Badge>
              <Badge variant="info">Real-time JSON</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Compatible with Microsoft Excel & Google Sheets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <Table className="min-w-[960px]">
          <TableHeader>
            <TableRow>
              <TableHead>Ref Number</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Departure Date</TableHead>
              <TableHead className="text-right">Travelers</TableHead>
              <TableHead className="text-right">Gross PHP</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Booking Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  <RefreshCw className="mx-auto mb-2 h-5 w-5 animate-spin text-slate-400" />
                  Generating report preview...
                </TableCell>
              </TableRow>
            ) : bookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-muted-foreground">
                  No reservations found within the selected departure dates.
                </TableCell>
              </TableRow>
            ) : (
              bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs font-medium text-foreground">
                    {b.bookingReference}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-foreground">{b.customerName}</div>
                    <div className="text-xs text-muted-foreground">{b.customerEmail}</div>
                  </TableCell>
                  <TableCell className="text-slate-700">
                    {b.packageName}
                  </TableCell>
                  <TableCell className="whitespace-nowrap tabular-nums text-slate-700">
                    {b.departureDate}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-slate-700">
                    {b.numberOfTravelers || 1}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-medium tabular-nums text-foreground">
                    {formatPHP(b.totalPrice)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={b.paymentStatus === 'Paid' ? 'success' : 'warning'}>
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
                          : b.bookingStatus === 'Pending'
                          ? 'warning'
                          : b.bookingStatus === 'Cancelled'
                          ? 'destructive'
                          : 'outline'
                      }
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
