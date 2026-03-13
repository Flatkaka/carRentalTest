import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { ApproveCarButton, RejectCarButton } from "@/components/approve-car-button";
import { MapPin, Users, Fuel, Settings2, Shield, ArrowLeft } from "lucide-react";

const statusColors: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

async function CarDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", claims.claims.sub)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: car } = await supabase
    .from("cars")
    .select("*, car_images(*), owner:users(id, username, full_name, email, phone)")
    .eq("id", id)
    .single();

  if (!car) notFound();

  const owner = car.owner;
  const ownerName = owner?.username ?? owner?.full_name ?? owner?.email ?? "Unknown";
  const images = car.car_images ?? [];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Admin
        </Link>
        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${statusColors[car.status] ?? ""}`}>
          {car.status}
        </span>
      </div>

      {/* Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
          <div className="relative col-span-2 h-72 bg-muted">
            <Image src={images[0].url} alt={`${car.make} ${car.model}`} fill unoptimized className="object-cover" priority />
          </div>
          {images.slice(1, 4).map((img: any, i: number) => (
            <div key={i} className="relative h-40 bg-muted">
              <Image src={img.url} alt={`Photo ${i + 2}`} fill unoptimized className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Car info */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">{car.year} {car.make} {car.model}</h2>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              {car.location}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-xl">
            <div className="flex flex-col items-center gap-1 text-center">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{car.seats} seats</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Settings2 className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium capitalize">{car.transmission}</span>
            </div>
            <div className="flex flex-col items-center gap-1 text-center">
              <Fuel className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium capitalize">{car.fuel_type}</span>
            </div>
            {car.is_insured && (
              <div className="flex flex-col items-center gap-1 text-center">
                <Shield className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Insured</span>
              </div>
            )}
          </div>

          {car.description && (
            <div>
              <h3 className="font-semibold mb-1">Description</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{car.description}</p>
            </div>
          )}

          {car.is_insured && car.insurance_details && (
            <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl text-sm">
              <p className="font-medium text-green-800 dark:text-green-400 mb-1">Insurance Details</p>
              <p className="text-green-700 dark:text-green-500">{car.insurance_details}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">{car.transmission}</Badge>
            <Badge variant="secondary" className="capitalize">{car.fuel_type}</Badge>
            <Badge variant="secondary">{car.seats} seats</Badge>
            {car.is_insured && <Badge className="bg-green-600 text-white">Insured</Badge>}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Price */}
          <div className="p-4 border rounded-xl">
            <p className="text-3xl font-bold">${car.price_per_day}<span className="text-base font-normal text-muted-foreground">/day</span></p>
          </div>

          {/* Owner */}
          <div className="p-4 border rounded-xl space-y-2">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Owner</p>
            <Link href={`/admin/users/${owner?.id}`} className="font-semibold hover:underline block">
              {ownerName}
            </Link>
            {owner?.email && <p className="text-sm text-muted-foreground">{owner.email}</p>}
            {owner?.phone && <p className="text-sm text-muted-foreground">{owner.phone}</p>}
          </div>

          {/* Admin actions */}
          {car.status === "pending" && (
            <div className="p-4 border rounded-xl space-y-2">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Actions</p>
              <div className="flex gap-2">
                <ApproveCarButton carId={car.id} />
                <RejectCarButton carId={car.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCarPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Suspense fallback={<div className="h-[600px] animate-pulse bg-muted rounded-xl" />}>
        <CarDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
