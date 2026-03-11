"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ImageUploader } from "@/components/Car/image-uploader";
import type { Car } from "@/lib/types";

interface CarFormProps {
  car?: Car;
}

export function CarForm({ car }: CarFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>(
    car?.car_images?.map((img) => img.url) ?? []
  );

  const [form, setForm] = useState({
    make: car?.make ?? "",
    model: car?.model ?? "",
    year: car?.year?.toString() ?? "",
    description: car?.description ?? "",
    price_per_day: car?.price_per_day?.toString() ?? "",
    location: car?.location ?? "",
    seats: car?.seats?.toString() ?? "",
    transmission: car?.transmission ?? "automatic",
    fuel_type: car?.fuel_type ?? "petrol",
    is_insured: car?.is_insured ?? false,
    insurance_details: car?.insurance_details ?? "",
  });

  function set(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setError("You must be logged in.");
      setLoading(false);
      return;
    }

    const payload = {
      make: form.make,
      model: form.model,
      type: "Sedan",
      color: "white",
      year: parseInt(form.year),
      description: form.description || null,
      price_per_day: parseFloat(form.price_per_day),
      location: form.location,
      seats: parseInt(form.seats),
      transmission: form.transmission as "manual" | "automatic",
      fuel_type: form.fuel_type as "petrol" | "diesel" | "electric" | "hybrid",
      is_insured: form.is_insured,
      insurance_details: form.is_insured ? form.insurance_details || null : null,
    };

    let carId = car?.id;

    if (car) {
      const { error: updateError } = await supabase
        .from("cars")
        .update(payload)
        .eq("id", car.id);
      if (updateError) {
        setError(updateError.message);
        setLoading(false);
        return;
      }
    } else {
      const { data: newCar, error: insertError } = await supabase
        .from("cars")
        .insert({ ...payload, owner_id: userData.user.id })
        .select()
        .single();
      if (insertError || !newCar) {
        setError(insertError?.message ?? "Failed to create car.");
        setLoading(false);
        return;
      }
      carId = newCar.id;
    }

    // Sync images
    if (carId) {
      const { error: deleteError } = await supabase.from("car_images").delete().eq("car_id", carId);
      if (deleteError) {
        setError(`Failed to update images: ${deleteError.message}`);
        setLoading(false);
        return;
      }
      if (imageUrls.length > 0) {
        const { error: imgInsertError } = await supabase.from("car_images").insert(
          imageUrls.map((url, i) => ({ car_id: carId, url, order: i }))
        );
        if (imgInsertError) {
          setError(`Failed to save images: ${imgInsertError.message}`);
          setLoading(false);
          return;
        }
      }
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make *</Label>
          <Input
            id="make"
            value={form.make}
            onChange={(e) => set("make", e.target.value)}
            placeholder="e.g. Toyota"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model *</Label>
          <Input
            id="model"
            value={form.model}
            onChange={(e) => set("model", e.target.value)}
            placeholder="e.g. Camry"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year *</Label>
          <Input
            id="year"
            type="number"
            value={form.year}
            onChange={(e) => set("year", e.target.value)}
            placeholder="2022"
            min="1900"
            max="2030"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Describe your car, any special features, rules, etc."
          className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price_per_day">Price per day ($) *</Label>
          <Input
            id="price_per_day"
            type="number"
            value={form.price_per_day}
            onChange={(e) => set("price_per_day", e.target.value)}
            placeholder="75"
            min="1"
            step="0.01"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. San Francisco, CA"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="seats">Seats *</Label>
          <Input
            id="seats"
            type="number"
            value={form.seats}
            onChange={(e) => set("seats", e.target.value)}
            placeholder="5"
            min="1"
            max="20"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transmission">Transmission *</Label>
          <select
            id="transmission"
            value={form.transmission}
            onChange={(e) => set("transmission", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuel_type">Fuel Type *</Label>
          <select
            id="fuel_type"
            value={form.fuel_type}
            onChange={(e) => set("fuel_type", e.target.value)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="petrol">Petrol</option>
            <option value="diesel">Diesel</option>
            <option value="electric">Electric</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Checkbox
            id="is_insured"
            checked={form.is_insured}
            onCheckedChange={(checked) => set("is_insured", !!checked)}
          />
          <Label htmlFor="is_insured">Car is insured</Label>
        </div>
        {form.is_insured && (
          <div className="space-y-2">
            <Label htmlFor="insurance_details">Insurance Details</Label>
            <Input
              id="insurance_details"
              value={form.insurance_details}
              onChange={(e) => set("insurance_details", e.target.value)}
              placeholder="e.g. Full coverage with Allianz, policy #12345"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label>Photos</Label>
        <ImageUploader value={imageUrls} onChange={setImageUrls} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : car ? "Save Changes" : "List My Car"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
