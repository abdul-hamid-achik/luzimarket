"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from 'next-intl';

const newsletterSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type NewsletterForm = z.infer<typeof newsletterSchema>;

export default function Newsletter() {
  const t = useTranslations('Footer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<NewsletterForm>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: NewsletterForm) {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setIsSuccess(true);
        form.reset();
        setTimeout(() => setIsSuccess(false), 5000);
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md">
      <h3 className="text-lg font-univers mb-4">{t('newsletter')}</h3>
      {isSuccess ? (
        <p className="text-sm text-green-600 font-univers">
          ¡Gracias por suscribirte!
        </p>
      ) : (
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-2">
          <Input
            type="email"
            placeholder={t('newsletterPlaceholder')}
            {...form.register("email")}
            className="flex-1 font-univers text-sm"
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            className="bg-black text-white hover:bg-gray-800 font-univers text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : t('subscribe')}
          </Button>
        </form>
      )}
      {form.formState.errors.email && (
        <p className="text-sm text-red-500 mt-1 font-univers">
          {form.formState.errors.email.message}
        </p>
      )}
    </div>
  );
}