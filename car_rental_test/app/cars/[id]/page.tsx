import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { BookingWidget } from "@/components/booking-widget";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users, Fuel, Settings2, Shield, Pencil } from "lucide-react";
import type { Car } from "@/lib/types";

async function CarDetailContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const supabase = await createClient();

  const { data: car } = await supabase
    .from("cars")
    .select("*, car_images(*), owner:users(id, full_name, email, avatar_url)")
    .eq("id", id)
    .single();

  if (!car) notFound();

  const typedCar = car as Car;

  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub ?? null;
  const isOwner = userId === typedCar.owner_id;
  const images = typedCar.car_images ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left: details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Photo gallery */}
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 rounded-xl overflow-hidden">
            <div className="relative col-span-2 h-72 sm:h-96 bg-muted">
              <Image
                src={images[0].url}
                alt={`${typedCar.make} ${typedCar.model}`}
                fill
                unoptimized
                className="object-cover"
                priority
              />
            </div>
            {images.slice(1, 4).map((img, i) => (
              <div key={i} className="relative h-40 bg-muted">
                <Image
                  src={img.url}
                  alt={`Photo ${i + 2}`}
                  fill
                  unoptimized
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="h-72 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
            No photos available
          </div>
        )}

        {/* Title & actions */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {typedCar.year} {typedCar.make} {typedCar.model}
            </h1>
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="h-4 w-4" />
              <span>{typedCar.location}</span>
            </div>
          </div>
          {isOwner && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/cars/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-1" /> Edit
              </Link>
            </Button>
          )}
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-xl">
          <div className="flex flex-col items-center gap-1 text-center">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">{typedCar.seats} seats</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Settings2 className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium capitalize">{typedCar.transmission}</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <Fuel className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium capitalize">{typedCar.fuel_type}</span>
          </div>
          {typedCar.is_insured && (
            <div className="flex flex-col items-center gap-1 text-center">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-green-600">Insured</span>
            </div>
          )}
        </div>

        {/* Description */}
        {typedCar.description && (
          <div>
            <h2 className="text-xl font-semibold mb-2">About this car</h2>
            <p className="text-muted-foreground leading-relaxed">{typedCar.description}</p>
          </div>
        )}

        {/* Owner */}
        {typedCar.owner && (
          <div className="flex items-center gap-3 p-4 border rounded-xl">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-semibold text-sm flex-shrink-0">
              {typedCar.owner.full_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Hosted by</p>
              <p className="font-medium">{typedCar.owner.full_name ?? typedCar.owner.email ?? "Unknown"}</p>
            </div>
          </div>
        )}

        {/* Insurance details */}
        {typedCar.is_insured && typedCar.insurance_details && (
          <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
            <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-green-800 dark:text-green-400">Insurance Coverage</p>
              <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                {typedCar.insurance_details}
              </p>
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">{typedCar.transmission}</Badge>
          <Badge variant="secondary" className="capitalize">{typedCar.fuel_type}</Badge>
          <Badge variant="secondary">{typedCar.seats} seats</Badge>
          {typedCar.is_insured && <Badge className="bg-green-600 text-white">Insured</Badge>}
        </div>
      </div>

      {/* Right: booking widget */}
      <div className="lg:col-span-1">
        <BookingWidget car={typedCar} userId={userId} />
      </div>
    </div>
  );
}

interface CarDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CarDetailPage({ params }: CarDetailPageProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Suspense fallback={<div className="h-[600px] animate-pulse bg-muted rounded-xl" />}>
        <CarDetailContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
