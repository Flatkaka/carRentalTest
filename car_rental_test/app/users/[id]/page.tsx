import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, CalendarDays } from "lucide-react";
import type { Car, UserProfile } from "@/lib/types";

async function UserProfileContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const supabase = await createClient();

  const [{ data: user }, { data: cars }] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, full_name, avatar_url, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("cars")
      .select("*, car_images(*)")
      .eq("owner_id", id)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
  ]);

  if (!user) notFound();

  const displayName = (user as UserProfile).username ?? (user as UserProfile).full_name ?? "Anonymous";
  const activeCars = (cars ?? []) as Car[];

  return (
    <div className="space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-5 p-6 border rounded-xl">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
          {displayName[0]?.toUpperCase() ?? "?"}
        </div>
        <div>
          <h2 className="text-2xl font-bold">{displayName}</h2>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Member since {new Date(user.created_at).toLocaleDateString([], { dateStyle: "medium" })}</span>
          </div>
        </div>
      </div>

      {/* Listed cars */}
      <section>
        <h3 className="text-lg font-semibold mb-4">
          Cars listed by {displayName} ({activeCars.length})
        </h3>
        {activeCars.length === 0 ? (
          <p className="text-muted-foreground text-sm py-6 text-center border rounded-xl">No active cars listed.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCars.map((car) => {
              const firstImage = car.car_images?.[0]?.url;
              return (
                <Link key={car.id} href={`/cars/${car.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                    <div className="relative h-40 bg-muted">
                      {firstImage ? (
                        <Image
                          src={firstImage}
                          alt={`${car.make} ${car.model}`}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          No image
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm truncate">
                        {car.year} {car.make} {car.model}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{car.location}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          ${car.price_per_day}/day
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <UserProfileContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
