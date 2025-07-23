"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorRegistrationSchema, type VendorRegistration } from "@/lib/schemas/vendor";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { InputWithValidation } from "@/components/ui/input-with-validation";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle } from "lucide-react";
import Image from "next/image";
import { registerVendor } from "@/lib/actions/vendor";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export default function VendorRegistrationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const t = useTranslations("VendorRegistration");

  const form = useForm<z.infer<typeof vendorRegistrationSchema>>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      hasDelivery: false,
      country: "México",
      businessName: "",
      contactName: "",
      email: "",
      password: "",
      businessPhone: "",
      street: "",
      city: "",
      state: "",
      description: "",
    },
    mode: "onChange",
  });

  async function onSubmit(data: VendorRegistration) {
    setIsSubmitting(true);
    try {
      const result = await registerVendor(data);
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        const errorMessage = result.error ? t(result.error) : t("error");
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error(error);
      toast.error(t("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="mb-8">
          <Image
            src="/images/logos/flower-icon-1.png"
            alt="Success"
            width={100}
            height={100}
            className="mx-auto"
          />
        </div>

        <h2 className="text-6xl font-times-now mb-8">{t("thankYou")}</h2>
        
        <p className="text-lg font-univers text-gray-600 max-w-lg mx-auto">
          {t("confirmationMessage")}
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Business Information */}
        <div className="space-y-6">
          <h3 className="text-lg font-univers flex items-center gap-2">
            <span className="text-xl">+</span> {t("businessInfoSection")}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("businessNameLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation 
                      placeholder={t("businessNamePlaceholder")} 
                      {...field}
                      showValidation={form.formState.dirtyFields.businessName}
                      isValid={form.formState.dirtyFields.businessName && !form.formState.errors.businessName}
                      isInvalid={!!form.formState.errors.businessName}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("contactNameLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation placeholder={t("contactNamePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("emailLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation type="email" placeholder={t("email")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("passwordLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation type="password" placeholder={t("passwordPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsapp"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("whatsappLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation placeholder={t("phonePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("businessPhoneLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation placeholder={t("businessPhonePlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="businessHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("businessHoursLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation placeholder={t("businessHoursPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("streetLabel")}</FormLabel>
                  <FormControl>
                    <InputWithValidation placeholder={t("streetPlaceholder")} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("cityLabel")}</FormLabel>
                    <FormControl>
                      <InputWithValidation placeholder={t("cityPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("stateLabel")}</FormLabel>
                    <FormControl>
                      <InputWithValidation placeholder={t("statePlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("countryLabel")}</FormLabel>
                    <FormControl>
                      <InputWithValidation placeholder={t("countryPlaceholder")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("websiteLabel")}</FormLabel>
                <FormControl>
                  <InputWithValidation placeholder={t("websitePlaceholder")} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("descriptionLabel")}</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder={t("descriptionPlaceholder")}
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Delivery Service */}
        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-univers flex items-center gap-2">
            <span className="text-xl">+</span> {t("deliverySection")}
          </h3>
          
          <div className="space-y-4">
            <p className="text-sm font-univers text-gray-600">{t("hasDelivery")}</p>
            
            <FormField
              control={form.control}
              name="hasDelivery"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => field.onChange(true)}
                          className="relative"
                          role="checkbox"
                          aria-checked={field.value === true}
                          aria-label={`${t("deliveryQuestion")} - ${t("yes")}`}
                        >
                          {field.value ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <span className="font-univers">{t("yes")}</span>
                      </label>
                      
                      <label className="flex items-center gap-2 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => field.onChange(false)}
                          className="relative"
                          role="checkbox"
                          aria-checked={field.value === false}
                          aria-label={`${t("deliveryQuestion")} - ${t("no")}`}
                        >
                          {!field.value ? (
                            <CheckCircle2 className="h-5 w-5 text-red-600" />
                          ) : (
                            <Circle className="h-5 w-5" />
                          )}
                        </button>
                        <span className="font-univers">{t("no")}</span>
                      </label>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("hasDelivery") && (
              <div className="flex gap-6">
                <label className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-univers">{t("own")}</span>
                </label>
                <label className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-univers">{t("external")}</span>
                </label>
              </div>
            )}

            <FormField
              control={form.control}
              name="deliveryService"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputWithValidation placeholder={t("deliveryServicePlaceholder")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Social Media */}
        <div className="space-y-6 border-t pt-6">
          <h3 className="text-lg font-univers flex items-center gap-2">
            <span className="text-xl">+</span> {t("socialMediaSection")}
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="instagramUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputWithValidation placeholder={t("instagram")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="facebookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputWithValidation placeholder={t("facebook")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tiktokUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputWithValidation placeholder={t("tiktok")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitterUrl"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <InputWithValidation placeholder={t("twitter")} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="text-center pt-8">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-black text-white px-16 py-6 font-univers text-base tracking-wider hover:bg-gray-900 rounded-none"
          >
            {isSubmitting ? t("submitting") : t("ready")}
          </Button>
        </div>
      </form>
    </Form>
  );
}