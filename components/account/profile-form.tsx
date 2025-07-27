"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Mail, Phone, Calendar } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(1, "Nombre requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  user?: {
    id: string;
    name: string | null;
    email: string;
    phone?: string | null;
    dateOfBirth?: string | null;
  } | null;
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      dateOfBirth: user?.dateOfBirth || "",
    },
  });

  const handleSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setSuccess(false);

    try {
      // Update user profile
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Nombre completo
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            disabled={isLoading}
            className="mt-1"
          />
          {form.formState.errors.name && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </Label>
          <Input
            id="email"
            type="email"
            {...form.register("email")}
            disabled={isLoading}
            className="mt-1"
          />
          {form.formState.errors.email && (
            <p className="text-sm text-red-600 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="phone" className="flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Teléfono (opcional)
          </Label>
          <Input
            id="phone"
            type="tel"
            {...form.register("phone")}
            disabled={isLoading}
            placeholder="+52 555 123 4567"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="dateOfBirth" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Fecha de nacimiento (opcional)
          </Label>
          <Input
            id="dateOfBirth"
            type="date"
            {...form.register("dateOfBirth")}
            disabled={isLoading}
            className="mt-1"
          />
        </div>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-sm text-green-600 font-univers">
            Perfil actualizado exitosamente
          </p>
        </div>
      )}

      <div className="flex justify-end pt-6">
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-black text-white hover:bg-gray-800"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </div>
    </form>
  );
}