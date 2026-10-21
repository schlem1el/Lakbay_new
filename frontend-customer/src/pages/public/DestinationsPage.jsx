import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { destinationsApi } from '../../api/destinationsApi';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { MapPin, Search, ArrowRight, Loader2, Sparkles, Filter } from 'lucide-react';

export const DestinationsPage = () => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');

  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const res = await destinationsApi.getAll(params);
      setDestinations(res.data || []);
    } catch (err) {
      console.error('Failed to load destinations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [category, sort]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDestinations();
  };

  const categories = ['All', 'Island', 'Beach', 'Heritage', 'Nature', 'Mountain'];

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-2">
            Archipelago Catalog
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 font-heading">
            Explore Philippine Destinations
          </h1>
          <p className="mt-3 text-slate-600 text-base">
            Discover tropical archipelagos, coastal sanctuaries, historical towns, and highland ridges across Luzon, Visayas, and Mindanao.
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-10">
          <div className="flex flex-col md:flex-row items-center gap-4 justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search destination, island, or region..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </form>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {categories.map((cat) => {
                const isActive = (cat === 'All' && !category) || category === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat === 'All' ? '' : cat)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
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

            {/* Sort Select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
                Sort:
              </span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="">Featured First</option>
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Destination Cards Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : destinations.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No destinations found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms or category filters.</p>
            <Button onClick={() => { setSearch(''); setCategory(''); }} className="mt-4 bg-emerald-600">
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {destinations.map((dest) => (
              <Card
                key={dest.id}
                className="group overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-60 overflow-hidden">
                    <img
                      src={dest.imageUrls?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'}
                      alt={dest.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="bg-emerald-600/90 text-white font-bold text-xs backdrop-blur-sm">
                        {dest.category || 'Island'}
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {dest.location}
                    </p>
                    <h3 className="text-xl font-bold text-slate-900 font-heading group-hover:text-emerald-700 transition-colors">
                      {dest.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {dest.description}
                    </p>

                    {/* Recommended Activities tags */}
                    {dest.recommendedActivities && dest.recommendedActivities.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {dest.recommendedActivities.slice(0, 3).map((act, i) => (
                          <span
                            key={i}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-6 pt-0 border-t border-slate-100 mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    {dest.region || 'Philippines'}
                  </span>
                  <Link to={`/destinations/${dest.id}`}>
                    <Button size="sm" className="bg-slate-900 hover:bg-emerald-600 text-white font-semibold text-xs">
                      Explore Details
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
