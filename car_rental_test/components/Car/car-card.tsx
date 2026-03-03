import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { Car } from "@/lib/types";

interface CarCardProps {
  car: Car;
}

export function CarCard({ car }: CarCardProps) {
  const firstImage = car.car_images?.[0]?.url;

  return (
    <Link href={`/cars/${car.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="relative h-48 bg-muted">
          {firstImage ? (
            <Image
              src={firstImage}
              alt={`${car.make} ${car.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image
            </div>
          )}
          {car.is_insured && (
            <Badge className="absolute top-2 right-2 bg-green-600 text-white">
              Insured
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">
                {car.year} {car.make} {car.model}
              </h3>
              <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{car.location}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="font-bold text-lg">${car.price_per_day}</span>
              <span className="text-muted-foreground text-xs block">/day</span>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              {car.transmission}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {car.fuel_type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {car.seats} seats
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
