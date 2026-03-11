import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Plus, Pencil } from "lucide-react";
import { DashboardTabs } from "@/components/dashboard-tabs";
import type { Car, UserProfile } from "@/lib/types";

async function DashboardContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) {
    redirect("/auth/login");
  }

  const userId = claims.claims.sub;

  const [{ data: myCars }, { data: profile }] = await Promise.all([
    supabase
      .from("cars")
      .select("*, car_images(*)")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("users").select("*").eq("id", userId).single(),
  ]);

  const typedProfile = profile as UserProfile | null;

  return (
    <>
      {/* Profile header */}
      {typedProfile && (
        <div className="flex items-center gap-4 mb-10 p-5 border rounded-xl">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
            {(typedProfile.username ?? typedProfile.full_name ?? typedProfile.email ?? "?")?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{typedProfile.username ?? typedProfile.full_name ?? "No username set"}</p>
            <p className="text-sm text-muted-foreground">{typedProfile.email}</p>
          </div>
        </div>
      )}

      {/* My Cars */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">My Cars</h2>
          <Button asChild size="sm">
            <Link href="/cars/new">
              <Plus className="h-4 w-4 mr-1" /> Add Car
            </Link>
          </Button>
        </div>
        {!myCars || myCars.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl">
            <p>You haven&apos;t listed any cars yet.</p>
            <Button asChild variant="link" className="mt-2">
              <Link href="/cars/new">List your first car</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(myCars as Car[]).map((car) => {
              const firstImage = car.car_images?.[0]?.url;
              return (
                <Card key={car.id} className="overflow-hidden">
                  <div className="relative h-36 bg-muted">
                    {firstImage ? (
                      <Image src={firstImage} alt={`${car.make} ${car.model}`} fill unoptimized className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{car.year} {car.make} {car.model}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{car.location}</span>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">${car.price_per_day}/day</Badge>
                    </div>
                    <Button asChild variant="outline" size="sm" className="w-full mt-3">
                      <Link href={`/cars/${car.id}/edit`}>
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

export default function DashboardPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <DashboardTabs />
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
