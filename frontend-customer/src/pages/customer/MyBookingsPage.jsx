import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { bookingsApi } from '../../api/bookingsApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/table';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Calendar,
  Search,
  Filter,
  ArrowRight,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export const MyBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'All') params.status = statusFilter;
      const res = await bookingsApi.getMyBookings(params);
      setBookings(res.data || []);
    } catch (err) {
      console.error('Fetch bookings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const statuses = ['All', 'Confirmed', 'Pending', 'Cancelled', 'Completed'];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Confirmed':
        return <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold">Confirmed</Badge>;
      case 'Pending':
        return <Badge className="bg-amber-100 text-amber-800 border-none font-bold">Pending Payment</Badge>;
      case 'Cancelled':
        return <Badge className="bg-red-100 text-red-800 border-none font-bold">Cancelled</Badge>;
      case 'Completed':
        return <Badge className="bg-blue-100 text-blue-800 border-none font-bold">Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status) => {
    switch (status) {
      case 'Paid':
        return <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Paid</span>;
      case 'Refunded':
        return <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">Refunded</span>;
      case 'Unpaid':
        return <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Unpaid</span>;
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-heading">My Tour Bookings</h1>
          <p className="mt-1 text-sm text-slate-500">
            View booking references, track departure schedules, and inspect payment receipts.
          </p>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {statuses.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table Card */}
      <Card className="rounded-2xl border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-base font-bold text-slate-800">No {statusFilter !== 'All' ? statusFilter : ''} bookings found</h3>
            <p className="text-xs text-slate-500 mt-1">Book your next trip to explore the Philippines.</p>
            <Link to="/packages" className="inline-block mt-4">
              <Button size="sm" className="bg-emerald-600 text-xs font-semibold">
                Explore Tour Packages
              </Button>
            </Link>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Tour Package</TableHead>
                <TableHead>Departure Date</TableHead>
                <TableHead>Travelers</TableHead>
                <TableHead>Total (PHP)</TableHead>
                <TableHead>Booking Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((b) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs font-bold text-slate-800">
                    {b.bookingReference}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-900">
                    {b.packageName}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-600">
                    {formatDate(b.departureDate)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {b.numberOfTravelers} guest(s)
                  </TableCell>
                  <TableCell className="font-extrabold text-slate-900">
                    {formatCurrency(b.totalPrice)}
                  </TableCell>
                  <TableCell>{getStatusBadge(b.bookingStatus)}</TableCell>
                  <TableCell>{getPaymentBadge(b.paymentStatus)}</TableCell>
                  <TableCell className="text-right">
                    <Link to={`/dashboard/bookings/${b.id}`}>
                      <Button size="sm" variant="outline" className="text-xs font-semibold">
                        View
                        <ArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
};
