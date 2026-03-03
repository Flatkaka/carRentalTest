export interface CarImage {
  id: string;
  car_id: string;
  url: string;
  order: number;
  created_at: string;
}

export interface Car {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  description: string | null;
  price_per_day: number;
  location: string;
  seats: number;
  transmission: "manual" | "automatic";
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid";
  is_insured: boolean;
  insurance_details: string | null;
  status: string;
  created_at: string;
  car_images?: CarImage[];
}

export interface Booking {
  id: string;
  car_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  cars?: Car;
}
