"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar } from "lucide-react";

interface SearchBarProps {
  defaultLocation?: string;
  defaultFrom?: string;
  defaultTo?: string;
}

export function SearchBar({ defaultLocation = "", defaultFrom = "", defaultTo = "" }: SearchBarProps) {
  const router = useRouter();
  const [location, setLocation] = useState(defaultLocation);
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);

  function handleSearch() {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/cars?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full max-w-3xl bg-background rounded-xl border shadow-lg p-3">
      <div className="flex items-center gap-2 flex-1">
        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Input
          placeholder="Where do you want to go?"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="border-0 shadow-none focus-visible:ring-0 p-0 h-auto text-sm"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>
      <div className="hidden sm:block w-px bg-border" />
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          className="text-sm bg-transparent outline-none text-foreground w-32"
          placeholder="From"
        />
      </div>
      <div className="hidden sm:block w-px bg-border" />
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <input
          type="date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          className="text-sm bg-transparent outline-none text-foreground w-32"
          placeholder="To"
        />
      </div>
      <Button onClick={handleSearch} className="gap-2">
        <Search className="h-4 w-4" />
        Search
      </Button>
    </div>
  );
}
