import React, { useState, useEffect } from 'react';
import { customerApi } from '../../api/customerApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { formatDate } from '../../lib/utils';
import { Bell, CheckCheck, Loader2, Info, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';

export const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getNotifications();
      setNotifications(res.data?.notifications || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await customerApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Mark read error:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'booking_cancelled_refunded':
      case 'departure_cancelled':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'cancellation_under_review':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 font-heading">
            Notifications Center
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time updates regarding your tour departures, payments, and refunds.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="rounded-2xl border-slate-200 p-12 text-center">
          <Bell className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No notifications</h3>
          <p className="text-xs text-slate-500 mt-1">You're all caught up on your travel updates.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 p-4 rounded-xl border transition-colors ${
                n.isRead
                  ? 'bg-white border-slate-200'
                  : 'bg-emerald-50/40 border-emerald-200 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">{getNotificationIcon(n.type)}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                    {!n.isRead && (
                      <Badge className="bg-emerald-600 text-white text-[9px] px-1.5 py-0 h-4">
                        New
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block font-medium">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  title="Mark as read"
                  className="rounded-lg p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-100/50 transition-colors cursor-pointer shrink-0"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
