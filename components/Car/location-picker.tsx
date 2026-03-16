"use client";

import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface LocationPickerProps {
  value: string;
  onChange: (location: string) => void;
}

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [search, setSearch] = useState(value);
  const [suggestions, setSuggestions] = useState<GeoJSON.Feature[]>([]);

  const reverseGeocode = useCallback(async (lng: number, lat: number) => {
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&types=place,address,neighborhood&language=en`
      );
      const data = await res.json();
      if (data.features?.[0]) {
        const place: string = data.features[0].place_name;
        onChange(place);
        setSearch(place);
      }
    } catch {}
  }, [onChange]);

  // Initialize map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("mapbox-gl").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const mapboxgl = mod.default;
      mapboxgl.accessToken = TOKEN;

      // Try to geocode the initial value to center the map
      async function init() {
        let center: [number, number] = [0, 20];
        let zoom = 2;

        if (value) {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(value)}.json?access_token=${TOKEN}&limit=1`
            );
            const data = await res.json();
            if (data.features?.[0]) {
              center = data.features[0].center as [number, number];
              zoom = 12;
            }
          } catch {}
        }

        if (cancelled || !containerRef.current) return;

        const map = new mapboxgl.Map({
          container: containerRef.current,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom,
        });

        const marker = new mapboxgl.Marker({ draggable: true, color: "#6366f1" })
          .setLngLat(center)
          .addTo(map);

        marker.on("dragend", () => {
          const { lng, lat } = marker.getLngLat();
          reverseGeocode(lng, lat);
        });

        map.on("click", (e) => {
          marker.setLngLat(e.lngLat);
          reverseGeocode(e.lngLat.lng, e.lngLat.lat);
        });

        mapRef.current = map;
        markerRef.current = marker;
      }

      init();
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSearch(query: string) {
    setSearch(query);
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${TOKEN}&types=country,region,place,address,neighborhood&language=en`
      );
      const data = await res.json();
      setSuggestions(data.features ?? []);
    } catch {}
  }

  function selectSuggestion(feature: any) {
    const [lng, lat] = feature.center as [number, number];
    const place: string = feature.place_name;
    onChange(place);
    setSearch(place);
    setSuggestions([]);
    if (mapRef.current && markerRef.current) {
      mapRef.current.flyTo({ center: [lng, lat], zoom: 13 });
      markerRef.current.setLngLat([lng, lat]);
    }
  }

  return (
    <div className="space-y-2">
      {/* Geocoder search */}
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search for a location…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
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

      {/* Map */}
      <div ref={containerRef} className="h-64 w-full rounded-lg border overflow-hidden" />
      <p className="text-xs text-muted-foreground">
        Search for an address or click / drag the marker on the map.
      </p>

      {/* Hidden input keeps form validation working */}
      <input type="text" name="_location_required" value={value} required readOnly className="sr-only" tabIndex={-1} />
    </div>
  );
}
