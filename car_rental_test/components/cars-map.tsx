"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, X, Fuel, Users, Settings2 } from "lucide-react";
import Link from "next/link";
import type { Car } from "@/lib/types";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

interface CarsMapProps {
  cars: Car[];
}

export function CarsMap({ cars }: CarsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);   // Mapbox target (has overflow:hidden)
  const mapWrapperRef = useRef<HTMLDivElement>(null);  // Outer wrapper — tooltips live here
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Map<number, { el: HTMLElement; coords: [number, number] }>>(new Map());
  const carRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const [listSearch, setListSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);

  const filteredCars = useMemo(() => {
    if (!listSearch.trim()) return cars;
    const q = listSearch.toLowerCase();
    return cars.filter(
      (c) =>
        c.make.toLowerCase().includes(q) ||
        c.model.toLowerCase().includes(q) ||
        (c.location ?? "").toLowerCase().includes(q) ||
        String(c.year).includes(q)
    );
  }, [cars, listSearch]);

  useEffect(() => {
    if (!containerRef.current || !mapWrapperRef.current || mapRef.current) return;
    let cancelled = false;

    // Capture wrapper ref for tooltip container (stable across async)
    const wrapper = mapWrapperRef.current;

    import("mapbox-gl").then(async (mod) => {
      if (cancelled || !containerRef.current) return;
      const mapboxgl = mod.default;
      mapboxgl.accessToken = TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [0, 20],
        zoom: 2,
      });

      mapRef.current = map;

      const locationCache = new Map<string, [number, number]>();

      await Promise.all(
        cars.map(async (car) => {
          if (!car.location || cancelled) return;

          let coords = locationCache.get(car.location);
          if (!coords) {
            try {
              const res = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(car.location)}.json?access_token=${TOKEN}&limit=1`
              );
              const data = await res.json();
              if (data.features?.[0]) {
                coords = data.features[0].center as [number, number];
                locationCache.set(car.location, coords);
              }
            } catch {}
          }

          if (!coords || cancelled) return;

          // Price-pill marker
          const el = document.createElement("div");
          el.style.cssText = `
            background: #6366f1;
            color: white;
            padding: 5px 11px;
            border-radius: 9999px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            white-space: nowrap;
            box-shadow: 0 2px 8px rgba(0,0,0,0.25);
            border: 2px solid white;
            transition: background 0.15s, transform 0.15s;
            user-select: none;
          `;
          el.textContent = `$${car.price_per_day}/day`;

          new mapboxgl.Marker({ element: el, anchor: "center" })
            .setLngLat(coords)
            .addTo(map);

          markersRef.current.set(car.id, { el, coords });
          el.style.display = "none"; // hidden until zoomed in

          el.addEventListener("click", () => {
            setSelectedCarId(car.id);
            const carEl = carRefs.current.get(car.id);
            if (carEl) carEl.scrollIntoView({ behavior: "smooth", block: "center" });
          });
        })
      );

      const MIN_ZOOM = 7;

      function updateMarkerVisibility() {
        const zoom = map.getZoom();
        const bounds = map.getBounds();
        markersRef.current.forEach(({ el, coords }) => {
          const visible = zoom >= MIN_ZOOM && bounds.contains(coords);
          el.style.display = visible ? "block" : "none";
        });
      }

      map.on("zoom", updateMarkerVisibility);
      map.on("move", updateMarkerVisibility);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update marker highlight when selection changes
  useEffect(() => {
    markersRef.current.forEach(({ el }, carId) => {
      if (carId === selectedCarId) {
        el.style.background = "#4f46e5";
        el.style.transform = "scale(1.2)";
        el.style.border = "2px solid #4f46e5";
        el.style.boxShadow = "0 4px 14px rgba(99,102,241,0.6)";
        el.style.zIndex = "10";
      } else {
        el.style.background = "#6366f1";
        el.style.transform = "scale(1)";
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 2px 8px rgba(0,0,0,0.25)";
        el.style.zIndex = "";
      }
    });
  }, [selectedCarId]);

  async function handleLocationSearch(query: string) {
    setLocationSearch(query);
    if (query.length < 3) { setSuggestions([]); return; }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&types=country,region,place,address&language=en`
      );
      const data = await res.json();
      setSuggestions(data.features ?? []);
    } catch {}
  }

  function selectSuggestion(feature: any) {
    const [lng, lat] = feature.center as [number, number];
    setLocationSearch(feature.place_name);
    setSuggestions([]);
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 11 });
  }

  function handleCarClick(car: Car) {
    setSelectedCarId(car.id);
    const info = markersRef.current.get(car.id);
    if (info && mapRef.current) {
      mapRef.current.flyTo({ center: info.coords, zoom: 12 });
    }
  }

  const selectedCar = cars.find((c) => c.id === selectedCarId) ?? null;

  return (
    <div className="flex w-full h-[calc(100vh-64px)]">
      {/* ── Left Sidebar (expands when a car is selected) ── */}
      <div
        className={[
          "flex-shrink-0 flex border-r border-border bg-background overflow-hidden transition-all duration-300",
          selectedCar ? "w-[640px]" : "w-80",
        ].join(" ")}
      >
        {/* Car list — always visible */}
        <div className="w-80 flex-shrink-0 flex flex-col border-r border-border overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Make, model, location…"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-0.5">
              {filteredCars.length} {filteredCars.length === 1 ? "car" : "cars"} available
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filteredCars.length === 0 && (
              <div className="p-6 text-center text-sm text-muted-foreground">No cars found</div>
            )}
            {filteredCars.map((car) => {
              const image = car.car_images?.[0]?.url;
              const isSelected = car.id === selectedCarId;
              return (
                <div
                  key={car.id}
                  ref={(el) => {
                    if (el) carRefs.current.set(car.id, el);
                    else carRefs.current.delete(car.id);
                  }}
                  className={[
                    "flex gap-3 p-3 cursor-pointer border-b border-border transition-colors hover:bg-muted/50",
                    isSelected
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-l-[3px] border-l-indigo-500"
                      : "border-l-[3px] border-l-transparent",
                  ].join(" ")}
                  onClick={() => handleCarClick(car)}
                >
                  <div className="w-20 h-16 rounded-md overflow-hidden flex-shrink-0 bg-muted">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-[10px]">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {car.year} {car.make} {car.model}
                    </div>
                    {car.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <MapPin className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{car.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        ${car.price_per_day}
                        <span className="text-xs font-normal text-muted-foreground">/day</span>
                      </span>
                      <Link
                        href={`/cars/${car.id}`}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded-md font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View →
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Car detail panel — slides in when a car is selected */}
        {selectedCar && (
          <div className="flex-1 flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
              <span className="text-sm font-semibold text-muted-foreground">Car details</span>
              <button
                onClick={() => setSelectedCarId(null)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Image */}
            <div className="h-48 bg-muted flex-shrink-0">
              {selectedCar.car_images?.[0]?.url ? (
                <img
                  src={selectedCar.car_images[0].url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                  No image
                </div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-3">
              <div>
                <h2 className="text-lg font-bold leading-tight">
                  {selectedCar.year} {selectedCar.make} {selectedCar.model}
                </h2>
                {selectedCar.location && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    {selectedCar.location}
                  </div>
                )}
              </div>

              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                ${selectedCar.price_per_day}
                <span className="text-sm font-normal text-muted-foreground">/day</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {selectedCar.seats && (
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-center">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium">{selectedCar.seats} seats</span>
                  </div>
                )}
                {selectedCar.transmission && (
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-center">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium capitalize">{selectedCar.transmission}</span>
                  </div>
                )}
                {selectedCar.fuel_type && (
                  <div className="flex flex-col items-center gap-1 rounded-lg border border-border p-2 text-center">
                    <Fuel className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium capitalize">{selectedCar.fuel_type}</span>
                  </div>
                )}
              </div>

              {selectedCar.description && (
                <p className="text-sm text-muted-foreground line-clamp-3">{selectedCar.description}</p>
              )}

              <Link
                href={`/cars/${selectedCar.id}`}
                className="mt-auto block w-full bg-indigo-600 hover:bg-indigo-700 text-white text-center py-2.5 rounded-lg font-semibold text-sm transition-colors"
              >
                View Full Details →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* ── Map ── */}
      {/* mapWrapperRef: position:relative, no overflow:hidden — tooltips are safe here */}
      <div ref={mapWrapperRef} className="flex-1 relative">
        {/* Location search overlay */}
        <div className="absolute top-4 left-4 z-10 w-72">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9 bg-background/95 backdrop-blur shadow-lg border-border"
              placeholder="Search a city or location…"
              value={locationSearch}
              onChange={(e) => handleLocationSearch(e.target.value)}
              onBlur={() => setTimeout(() => setSuggestions([]), 150)}
            />
            {suggestions.length > 0 && (
              <ul className="absolute z-50 mt-1 w-full rounded-md border border-border bg-background shadow-lg max-h-52 overflow-y-auto">
                {suggestions.map((f: any) => (
                  <li
                    key={f.id}
                    className="cursor-pointer px-3 py-2 text-sm hover:bg-muted"
                    onMouseDown={() => selectSuggestion(f)}
                  >
                    {f.place_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Mapbox target — Mapbox forces overflow:hidden here, so tooltips cannot live inside */}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
  );
}
