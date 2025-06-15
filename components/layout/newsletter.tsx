"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { InputWithValidation } from "@/components/ui/input-with-validation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const newsletterSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

export function Newsletter() {
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: NewsletterForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Error al suscribirse");
      }

      toast.success("¡Te has suscrito exitosamente!");
      form.reset();
    } catch (error) {
      toast.error("Error al suscribirse. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-gradient-to-r from-pink-50 to-yellow-50 py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-times-now mb-4">
            Únete a la familia Luzimarket
          </h2>
          <p className="text-lg font-univers text-gray-700 mb-8">
            Recibe las últimas novedades, ofertas exclusivas y productos handpicked directamente en tu correo.
          </p>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-4 max-w-md mx-auto">
            <div className="flex-1">
              <InputWithValidation
                type="email"
                placeholder="Tu correo electrónico"
                {...form.register("email")}
                showValidation={form.formState.dirtyFields.email}
                isValid={form.formState.dirtyFields.email && !form.formState.errors.email}
                isInvalid={!!form.formState.errors.email}
                className="h-12"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-black text-white hover:bg-gray-800 px-8 h-12 rounded-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Suscribirse"
              )}
            </Button>
          </form>
          
          <p className="text-xs text-gray-600 font-univers mt-4">
            Al suscribirte, aceptas nuestra política de privacidad
          </p>
        </div>
      </div>
    </section>
  );
}