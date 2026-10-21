import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { destinationsApi } from '../../api/destinationsApi';
import { packagesApi } from '../../api/packagesApi';
import { externalApi } from '../../api/externalApi';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatCurrency } from '../../lib/utils';
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Compass,
  ShieldCheck,
  CreditCard,
  Headphones,
  Sparkles,
  ArrowRight,
  Star,
  ChevronDown,
} from 'lucide-react';

export const HomePage = () => {
  const navigate = useNavigate();

  // Search hero inputs
  const [searchQuery, setSearchQuery] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [travelers, setTravelers] = useState(2);
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  const [isSearchingAutocomplete, setIsSearchingAutocomplete] = useState(false);

  // Catalog data
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [popularPackages, setPopularPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debounced Geoapify destination autocomplete
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setAutocompleteResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingAutocomplete(true);
      try {
        const res = await externalApi.autocompleteLocation(searchQuery);
        setAutocompleteResults(res.data || []);
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setIsSearchingAutocomplete(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load featured destinations and popular packages
  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [destRes, pkgRes] = await Promise.all([
          destinationsApi.getFeatured(),
          packagesApi.getFeatured(),
        ]);
        setFeaturedDestinations(destRes.data || []);
        setPopularPackages(pkgRes.data || []);
      } catch (err) {
        console.error('Home data load error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    if (departureDate) params.append('departureDate', departureDate);
    if (travelers) params.append('travelers', travelers);
    navigate(`/packages?${params.toString()}`);
  };

  const handleSelectAutocomplete = (item) => {
    setSearchQuery(item.name || item.formatted);
    setAutocompleteResults([]);
  };

  const faqs = [
    {
      q: 'How does booking and payment via Stripe work?',
      a: 'All prices on Lakbay are quoted in Philippine Pesos (PHP). When you select a package and departure schedule, seats are reserved in real-time, and you are guided through Stripe Checkout. We accept international credit/debit cards, Visa, and Mastercard with instant confirmation.',
    },
    {
      q: 'What is the early-cancellation policy and how are refunds handled?',
      a: 'Each tour package specifies a cancellationCutoffDays threshold (typically 7 to 14 days before departure). If you cancel on or before the cutoff date, our platform automatically triggers an instant Stripe refund and releases your seats. Cancellations requested after the cutoff date are reviewed by our Support Agents for exceptions.',
    },
    {
      q: 'Are tour guides licensed and accredited?',
      a: 'Yes, every Lakbay departure is led by a Department of Tourism (DOT) accredited local tour guide who coordinates daily activities, manages safety manifests, and checks in travelers.',
    },
    {
      q: 'Can I save companion profiles for faster checkout?',
      a: 'Yes! Registered customers have a dedicated "Saved Co-Travelers" manager in their dashboard to save full names, birthdates, and dietary/medical notes for easy one-click checkout.',
    },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION WITH GEOAPIFY AUTOCOMPLETE */}
      <section className="relative min-h-[640px] flex items-center justify-center bg-slate-900 text-white overflow-hidden py-24 px-4 sm:px-6 lg:px-8">
        {/* Background Image with Dark Gradient Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 scale-105 transform duration-1000"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-slate-900/40" />

        <div className="relative z-10 container mx-auto max-w-5xl text-center">
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="h-3.5 w-3.5 mr-1.5 inline text-emerald-400" />
            Island Escapes in the Philippines
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight font-heading leading-tight max-w-4xl mx-auto">
            Discover Your Next <span className="text-emerald-400 underline decoration-emerald-500/40 underline-offset-8">Adventure</span>.
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal">
            Immerse yourself in breathtaking Philippine destinations with curated multi-day tour packages, transparent PHP pricing, and secure online bookings.
          </p>

          {/* Search Box Card with Geoapify Autocomplete */}
          <div className="mt-10 mx-auto max-w-4xl rounded-2xl bg-white/95 p-4 sm:p-5 text-slate-900 shadow-2xl backdrop-blur-md border border-white/20">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Destination Autocomplete Input */}
              <div className="md:col-span-5 relative text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Destination or Place
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-emerald-600" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Where to? (e.g. El Nido, Coron, Siargao)"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
                  />
                </div>

                {/* Autocomplete Dropdown */}
                {autocompleteResults.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-2 rounded-xl border border-slate-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in-0 zoom-in-95">
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Suggested Destinations
                    </p>
                    {autocompleteResults.map((item, idx) => (
                      <button
                        key={`${item.name}-${idx}`}
                        type="button"
                        onClick={() => handleSelectAutocomplete(item)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-pointer"
                      >
                        <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-900">{item.name}</span>
                        <span className="text-xs text-slate-500 truncate">{item.formatted}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Optional Departure Date */}
              <div className="md:col-span-3 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Departure Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Number of Travelers */}
              <div className="md:col-span-2 text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Travelers
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-5 w-5 text-slate-400 pointer-events-none" />
                  <select
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-3 py-2.5 text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? 'Guest' : 'Guests'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search Submit Button */}
              <div className="md:col-span-2 pt-2 md:pt-5">
                <Button
                  type="submit"
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </form>
          </div>

          {/* Quick CTA Links */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link to="/packages">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 font-bold px-7 rounded-xl shadow-lg shadow-emerald-600/25">
                Browse Tour Packages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/destinations">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 font-bold px-7 rounded-xl bg-white/5 backdrop-blur-sm">
                Explore Destinations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. FEATURED DESTINATIONS */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-2">
                Top Picks
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                Featured Destinations
              </h2>
              <p className="mt-2 text-slate-600 max-w-xl text-sm">
                Explore the most sought-after islands, coastal paradises, and cultural landscapes across the archipelago.
              </p>
            </div>
            <Link to="/destinations" className="mt-4 md:mt-0">
              <Button variant="outline" className="font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                View All Destinations
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredDestinations.map((dest) => (
              <Card
                key={dest.id}
                className="group overflow-hidden rounded-2xl border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={dest.imageUrls?.[0] || 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=800&q=80'}
                    alt={dest.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="rounded-md bg-emerald-600/90 backdrop-blur-sm px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider">
                      {dest.category || 'Island'}
                    </span>
                    <h3 className="text-xl font-bold font-heading mt-2">{dest.name}</h3>
                    <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-emerald-400" />
                      {dest.location}
                    </p>
                  </div>
                </div>
                <CardContent className="p-5 flex flex-col justify-between">
                  <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                    {dest.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700">
                      {dest.relatedPackages?.length || 2}+ Tour Packages
                    </span>
                    <Link to={`/destinations/${dest.id}`}>
                      <Button size="sm" className="bg-slate-900 hover:bg-emerald-600 text-white font-semibold text-xs">
                        Explore
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. POPULAR TOUR PACKAGES */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-2">
                Best Sellers
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
                Popular Tour Packages
              </h2>
              <p className="mt-2 text-slate-600 max-w-xl text-sm">
                Curated multi-day itineraries with daily activity schedules, licensed guides, and seamless booking.
              </p>
            </div>
            <Link to="/packages" className="mt-4 md:mt-0">
              <Button variant="outline" className="font-semibold text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                Browse All Packages
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {popularPackages.map((pkg) => (
              <Card
                key={pkg.id}
                className="group flex flex-col overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-300"
              >
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={pkg.imageUrls?.[0] || 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=800&q=80'}
                    alt={pkg.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-white/90 text-slate-900 font-bold backdrop-blur-sm shadow-sm text-xs">
                      {pkg.durationDays}D / {pkg.durationNights}N
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-emerald-600 text-white font-bold shadow-sm text-xs">
                      {pkg.category}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-6 flex-1 flex flex-col justify-between">
                  <div>
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
                    <h3 className="text-lg font-bold text-slate-900 font-heading group-hover:text-emerald-700 transition-colors">
                      {pkg.name}
                    </h3>
                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {pkg.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="block text-[11px] text-slate-400 font-medium">Starting from</span>
                      <span className="text-xl font-black text-slate-900 font-heading">
                        {formatCurrency(pkg.pricePerPerson)}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">/ person</span>
                    </div>

                    <div className="flex gap-2">
                      <Link to={`/packages/${pkg.id}`}>
                        <Button size="sm" variant="outline" className="font-semibold text-xs">
                          Details
                        </Button>
                      </Link>
                      <Link to={`/packages/${pkg.id}`}>
                        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20">
                          Book Now
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-2">
              The Lakbay Difference
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              Why Travel With Us
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              We eliminate the stress of island coordination with transparent pricing, certified partners, and reliable support.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
            {[
              {
                icon: Compass,
                title: 'Easy Online Booking',
                desc: 'Select departure dates and reserve slots online with instant seat locking.',
              },
              {
                icon: MapPin,
                title: 'Handcrafted Itineraries',
                desc: 'Every daily activity is carefully planned with local guides and verified coordinates.',
              },
              {
                icon: CreditCard,
                title: 'Transparent PHP Pricing',
                desc: 'Zero hidden booking fees. What you see is what you pay in Philippine Pesos.',
              },
              {
                icon: ShieldCheck,
                title: 'Automatic Refund Policy',
                desc: 'Cancel before the package cutoff threshold and receive an automated Stripe refund.',
              },
              {
                icon: Headphones,
                title: 'Dedicated Local Support',
                desc: 'Support agents and licensed tour guides keep you covered from booking to return.',
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/20 transition-colors"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-4 shadow-sm">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h4 className="font-bold text-slate-900 text-base mb-2 font-heading">{feature.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-none font-semibold mb-2">
              Simple 5-Step Process
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-heading">
              How It Works
            </h2>
            <p className="mt-2 text-slate-400 text-sm">
              From island inspiration to your verified travel confirmation in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { step: '01', title: 'Explore Destinations', desc: 'Browse our curated destination guides with live weather & Leaflet maps.' },
              { step: '02', title: 'Choose a Tour', desc: 'Select multi-day tour packages with day-by-day activity itineraries.' },
              { step: '03', title: 'Pick Departure', desc: 'Choose an open schedule on our interactive OpenWeather departure calendar.' },
              { step: '04', title: 'Book & Pay in PHP', desc: 'Pay securely via Stripe Checkout with card or mobile payment options.' },
              { step: '05', title: 'Travel & Check In', desc: 'Receive instant booking reference, itinerary vouchers, and guide support.' },
            ].map((s, i) => (
              <div key={i} className="relative flex flex-col p-6 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                <span className="text-3xl font-black text-emerald-400 font-heading mb-3">{s.step}</span>
                <h4 className="text-base font-bold text-white mb-2 font-heading">{s.title}</h4>
                <p className="text-xs text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <div className="text-center mb-14">
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-semibold mb-2">
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-slate-600 text-sm">
              Everything you need to know about departures, Stripe payments, and early cancellations.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between text-left font-bold text-slate-900 text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180 text-emerald-600' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
