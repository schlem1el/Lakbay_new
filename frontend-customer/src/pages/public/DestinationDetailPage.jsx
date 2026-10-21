import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { destinationsApi } from '../../api/destinationsApi';
import { externalApi } from '../../api/externalApi';
import { DestinationMap } from '../../components/common/DestinationMap';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatCurrency } from '../../lib/utils';
import {
  MapPin,
  CloudSun,
  Compass,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Users,
  Wind,
  Droplets,
  Loader2,
} from 'lucide-react';

export const DestinationDetailPage = () => {
  const { id } = useParams();
  const [destination, setDestination] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const fetchDestinationData = async () => {
      setLoading(true);
      try {
        const res = await destinationsApi.getById(id);
        const data = res.data;
        setDestination(data);

        // Fetch live weather using destination coordinates
        if (data.coordinates?.lat && data.coordinates?.lng) {
          try {
            const weatherRes = await externalApi.getWeather(data.coordinates.lat, data.coordinates.lng);
            setWeather(weatherRes.data);
          } catch (wErr) {
            console.warn('Live weather load error:', wErr);
          }
        }
      } catch (err) {
        console.error('Failed to load destination details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!destination) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Destination Not Found</h2>
        <Link to="/destinations" className="mt-4 inline-block">
          <Button variant="outline">Back to Destinations</Button>
        </Link>
      </div>
    );
  }

  const images = destination.imageUrls?.length > 0
    ? destination.imageUrls
    : ['https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=1200&q=80'];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
        {/* Back link */}
        <Link
          to="/destinations"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-emerald-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to All Destinations
        </Link>

        {/* Title & Location Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-600 text-white font-bold text-xs">
                {destination.category || 'Island'}
              </Badge>
              <span className="text-xs font-semibold text-slate-500">{destination.region}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-heading">
              {destination.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 flex items-center gap-1.5 font-medium">
              <MapPin className="h-4 w-4 text-emerald-600" />
              {destination.location}, {destination.country || 'Philippines'}
            </p>
          </div>

          {/* Current Live Weather Widget */}
          {weather && (
            <div className="flex items-center gap-4 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 shadow-sm shrink-0">
              <img src={weather.iconUrl} alt={weather.condition} className="h-12 w-12" />
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-heading">{weather.temp}°C</span>
                  <span className="text-xs font-bold text-emerald-800">{weather.condition}</span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Droplets className="h-3 w-3 text-emerald-600" />
                    {weather.humidity}% humidity
                  </span>
                  <span className="flex items-center gap-1">
                    <Wind className="h-3 w-3 text-emerald-600" />
                    {weather.windSpeed} m/s
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Image Gallery */}
        <div className="mb-12">
          <div className="relative h-96 sm:h-[480px] w-full overflow-hidden rounded-2xl shadow-lg border border-slate-200">
            <img
              src={images[activeImageIndex]}
              alt={destination.name}
              className="h-full w-full object-cover transition-all duration-500"
            />
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImageIndex(i)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                    activeImageIndex === i ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Description & Recommended Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-14">
          <div className="lg:col-span-2 space-y-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900 font-heading mb-4">
                About {destination.name}
              </h2>
              <p className="text-slate-700 leading-relaxed text-base whitespace-pre-line">
                {destination.description}
              </p>

              {/* Recommended Activities */}
              {destination.recommendedActivities && destination.recommendedActivities.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h3 className="text-lg font-bold text-slate-900 font-heading mb-4 flex items-center gap-2">
                    <Compass className="h-5 w-5 text-emerald-600" />
                    Recommended Activities
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {destination.recommendedActivities.map((act, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 rounded-xl bg-slate-50 p-3 border border-slate-100 text-sm font-semibold text-slate-800"
                      >
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Leaflet Map */}
            <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900 font-heading flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  Interactive Map & Coordinates
                </h3>
                <span className="text-xs font-semibold text-slate-400">
                  {destination.coordinates?.lat?.toFixed(4)}, {destination.coordinates?.lng?.toFixed(4)}
                </span>
              </div>
              <DestinationMap
                coordinates={destination.coordinates}
                destinationName={destination.name}
                locationName={destination.location}
                height="380px"
              />
            </div>
          </div>

          {/* Sidebar Travel Summary */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 font-heading mb-4">
                Travel Snapshot
              </h3>
              <dl className="space-y-3.5 text-sm">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium">Country</dt>
                  <dd className="font-bold text-slate-900">{destination.country || 'Philippines'}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium">Region</dt>
                  <dd className="font-bold text-slate-900">{destination.region}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium">Category</dt>
                  <dd className="font-bold text-emerald-700">{destination.category || 'Island'}</dd>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <dt className="text-slate-500 font-medium">Currency</dt>
                  <dd className="font-bold text-slate-900">Philippine Peso (PHP)</dd>
                </div>
                <div className="flex justify-between py-1.5">
                  <dt className="text-slate-500 font-medium">Related Tours</dt>
                  <dd className="font-bold text-slate-900">{destination.relatedPackages?.length || 0} Tours Available</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Related Tour Packages */}
        {destination.relatedPackages && destination.relatedPackages.length > 0 && (
          <div className="mt-14 pt-12 border-t border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mb-6">
              Tour Packages in {destination.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {destination.relatedPackages.map((pkg) => (
                <Card key={pkg.id} className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all">
                  <div className="h-48 overflow-hidden">
                    <img
                      src={pkg.imageUrls?.[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'}
                      alt={pkg.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <CardContent className="p-5 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base font-heading mb-1">{pkg.name}</h4>
                      <p className="text-xs text-slate-500 line-clamp-2">{pkg.description}</p>
                    </div>
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">From</span>
                        <span className="font-extrabold text-slate-900 text-lg">{formatCurrency(pkg.pricePerPerson)}</span>
                      </div>
                      <Link to={`/packages/${pkg.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs">
                          View Tour
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
