export interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  username: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface CarImage {
  id: string;
  car_id: string;
  url: string;
  order: number;
  created_at: string;
}

export interface Car {
  id: number;
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
  blocked_dates?: { start: string; end: string }[];
  created_at: string;
  car_images?: CarImage[];
  owner?: UserProfile;
}

export interface Booking {
  id: string;
  car_id: number;
  renter_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  created_at: string;
  cars?: Car;
}
