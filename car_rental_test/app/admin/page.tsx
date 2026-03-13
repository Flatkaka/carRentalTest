import { redirect } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApproveCarButton, RejectCarButton } from "@/components/approve-car-button";
import { MapPin } from "lucide-react";

const statusColors: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

async function AdminContent() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) redirect("/auth/login");

  // Verify admin
  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", claims.claims.sub)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: pendingCars } = await supabase
    .from("cars")
    .select("*, car_images(*), owner:users(id, username, full_name, email)")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: allCars } = await supabase
    .from("cars")
    .select("*, car_images(*), owner:users(id, username, full_name, email)")
    .neq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-10">
      {/* Pending approvals */}
      <section>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          Pending Approvals
          {pendingCars && pendingCars.length > 0 && (
            <span className="text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 px-2 py-0.5 rounded-full">
              {pendingCars.length}
            </span>
          )}
        </h2>
        {!pendingCars || pendingCars.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl">
            No cars pending approval.
          </div>
        ) : (
          <div className="space-y-4">
            {pendingCars.map((car) => (
              <AdminCarCard key={car.id} car={car} showActions />
            ))}
          </div>
        )}
      </section>

      {/* Recently approved/rejected */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Recent Listings</h2>
        {!allCars || allCars.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground border rounded-xl">
            No approved or rejected listings.
          </div>
        ) : (
          <div className="space-y-4">
            {allCars.map((car) => (
              <AdminCarCard key={car.id} car={car} showActions={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminCarCard({ car, showActions }: { car: any; showActions: boolean }) {
  const firstImage = car.car_images?.[0]?.url;
  const owner = car.owner;
  const ownerName = owner?.username ?? owner?.full_name ?? owner?.email ?? "Unknown";

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          <div className="relative w-full sm:w-44 h-36 sm:h-auto bg-muted flex-shrink-0">
            {firstImage ? (
              <Image src={firstImage} alt={`${car.make} ${car.model}`} fill unoptimized className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
            )}
          </div>

          <div className="flex-1 p-4 flex flex-col justify-between gap-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link href={`/admin/cars/${car.id}`} className="font-semibold text-base hover:underline">
                  {car.year} {car.make} {car.model}
                </Link>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {car.location}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Listed by{" "}
                  <Link href={`/admin/users/${car.owner?.id}`} className="text-foreground font-medium hover:underline">
                    {ownerName}
                  </Link>
                </p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColors[car.status] ?? ""}`}>
                {car.status}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary">{car.transmission}</Badge>
                <Badge variant="secondary">{car.fuel_type}</Badge>
                <Badge variant="secondary">{car.seats} seats</Badge>
                <Badge variant="secondary">${car.price_per_day}/day</Badge>
              </div>
              {showActions && (
                <div className="flex gap-2 flex-shrink-0">
                  <ApproveCarButton carId={car.id} />
                  <RejectCarButton carId={car.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-muted-foreground mb-8">Manage car listings and approvals.</p>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <AdminContent />
      </Suspense>
    </div>
  );
}
