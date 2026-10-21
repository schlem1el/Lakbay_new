import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { packagesApi } from '../../api/packagesApi';
import { destinationsApi } from '../../api/destinationsApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Users,
  Filter,
  ArrowRight,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react';

export const PackagesPage = () => {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';

  const [packages, setPackages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState(initialSearch);
  const [selectedDestination, setSelectedDestination] = useState('');
  const [category, setCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('featured');

  useEffect(() => {
    // Load destination options for the filter dropdown
    destinationsApi.getAll().then((res) => {
      setDestinations(res.data || []);
    });
  }, []);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (selectedDestination) params.destinationId = selectedDestination;
      if (category) params.category = category;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sort) params.sort = sort;

      const res = await packagesApi.getAll(params);
      setPackages(res.data || []);
    } catch (err) {
      console.error('Failed to load packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [selectedDestination, category, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPackages();
  };

  const handleResetFilters = () => {
    setSearch('');
    setSelectedDestination('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('featured');
    fetchPackages();
  };

  const categories = ['All', 'Island Hopping', 'Adventure', 'Beach', 'Heritage', 'Nature'];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-2">
            Tour Catalog
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-heading">
            Philippine Tour Packages
          </h1>
          <p className="mt-3 text-slate-600 text-base">
            Multi-day handcrafted itineraries with daily activity schedules, licensed guides, and transparent Philippine Peso pricing.
          </p>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-10">
          <form onSubmit={handleSearchSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Keyword Search */}
              <div className="md:col-span-2 relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search by package name or activity..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Destination Dropdown */}
              <div>
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">All Destinations</option>
                  {destinations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sorting */}
              <div>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="duration_asc">Duration: Shortest</option>
                  <option value="duration_desc">Duration: Longest</option>
                  <option value="name_asc">Name: A to Z</option>
                </select>
              </div>
            </div>

            {/* Category Pills & Price Filter Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
              {/* Category Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((cat) => {
                  const isActive = (cat === 'All' && !category) || category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat === 'All' ? '' : cat)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              {/* Price Filter Inputs & Action */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">PHP</span>
                <Input
                  type="number"
                  placeholder="Min ₱"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-24 h-9 text-xs"
                />
                <span className="text-slate-300">-</span>
                <Input
                  type="number"
                  placeholder="Max ₱"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-24 h-9 text-xs"
                />
                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-9 font-semibold text-xs">
                  Apply
                </Button>
                <Button
                  type="button"
                  onClick={handleResetFilters}
                  variant="ghost"
                  size="sm"
                  className="h-9 text-xs text-slate-500 hover:text-slate-800"
                >
                  Reset
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Packages Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <Calendar className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No tour packages match your filters</h3>
            <p className="text-sm text-slate-500 mt-1">Try relaxing your price range or selecting another destination.</p>
            <Button onClick={handleResetFilters} className="mt-4 bg-emerald-600">
              Reset All Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div>
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={pkg.imageUrls?.[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'}
                      alt={pkg.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-white/95 text-slate-900 font-bold text-xs backdrop-blur-sm shadow-sm flex items-center gap-1">
                        <Clock className="h-3 w-3 text-emerald-600" />
                        {pkg.durationDays}D / {pkg.durationNights}N
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-emerald-600 text-white font-bold text-xs shadow-sm">
                        {pkg.category}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {pkg.destinationName || 'Philippines'}
                      </p>
                      {pkg.averageRating > 0 ? (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                          <span>{pkg.averageRating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal text-[10px]">({pkg.reviewCount || 0})</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">New</span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 font-heading group-hover:text-emerald-700 transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>

                    {/* Schedule availability indicators */}
                    <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                        {pkg.nextDepartureDate ? `Next: ${formatDate(pkg.nextDepartureDate)}` : 'Upcoming departures'}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {pkg.availableSlots || 15} slots left
                      </span>
                    </div>
                  </CardContent>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-medium">Per traveler</span>
                    <span className="text-2xl font-black text-slate-900 font-heading">
                      {formatCurrency(pkg.pricePerPerson)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/packages/${pkg.id}`}>
                      <Button size="sm" variant="outline" className="font-semibold text-xs">
                        Details
                      </Button>
                    </Link>
                    <Link to={`/packages/${pkg.id}`}>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20">
                        Book Tour
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
