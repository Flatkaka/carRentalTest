import { redirect, notFound } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Mail, Phone, User } from "lucide-react";

const carStatusColors: Record<string, string> = {
  pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  active:   "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

async function UserProfileContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const { id } = await paramsPromise;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();

  if (!claims?.claims) redirect("/auth/login");

  const { data: adminProfile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", claims.claims.sub)
    .single();

  if (!adminProfile?.is_admin) redirect("/");

  const [{ data: user }, { data: cars }] = await Promise.all([
    supabase.from("users").select("*").eq("id", id).single(),
    supabase
      .from("cars")
      .select("*, car_images(*)")
      .eq("owner_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!user) notFound();

  const displayName = user.username ?? user.full_name ?? user.email ?? "Unknown";

  return (
    <div className="space-y-8">
      <Link href="/admin" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Admin
      </Link>

      {/* Profile card */}
      <div className="flex items-start gap-5 p-6 border rounded-xl">
        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
          {displayName[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{displayName}</h2>
            {user.is_admin && (
              <Badge className="bg-primary text-primary-foreground text-xs">Admin</Badge>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm text-muted-foreground">
            {user.email && (
              <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{user.phone}</span>
            )}
            {user.full_name && user.username && (
              <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" />{user.full_name}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Member since {new Date(user.created_at).toLocaleDateString([], { dateStyle: "medium" })}
          </p>
        </div>
      </div>

      {/* User's cars */}
      <section>
        <h3 className="text-lg font-semibold mb-4">Listed Cars ({cars?.length ?? 0})</h3>
        {!cars || cars.length === 0 ? (
          <p className="text-muted-foreground text-sm">No cars listed.</p>
        ) : (
          <div className="space-y-3">
            {cars.map((car) => {
              const firstImage = car.car_images?.[0]?.url;
              return (
                <Card key={car.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="relative w-28 h-24 bg-muted flex-shrink-0">
                        {firstImage ? (
                          <Image src={firstImage} alt={`${car.make} ${car.model}`} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                        )}
                      </div>
                      <div className="flex-1 p-3 flex items-center justify-between gap-3">
                        <div>
                          <Link href={`/admin/cars/${car.id}`} className="font-semibold text-sm hover:underline">
                            {car.year} {car.make} {car.model}
                          </Link>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <MapPin className="h-3 w-3" />{car.location}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">${car.price_per_day}/day</p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full capitalize flex-shrink-0 ${carStatusColors[car.status] ?? ""}`}>
                          {car.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold mb-8">User Profile</h1>
      <Suspense fallback={<div className="h-96 animate-pulse bg-muted rounded-xl" />}>
        <UserProfileContent paramsPromise={params} />
      </Suspense>
    </div>
  );
}
