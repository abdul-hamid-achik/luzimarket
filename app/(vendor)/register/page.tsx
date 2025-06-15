"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorRegistrationSchema, type VendorRegistration } from "@/lib/schemas/vendor";
import { Button } from "@/components/ui/button";
import { InputWithValidation } from "@/components/ui/input-with-validation";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Circle } from "lucide-react";
import Image from "next/image";

export default function VendorRegisterPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<VendorRegistration>({
    resolver: zodResolver(vendorRegistrationSchema),
    defaultValues: {
      hasDelivery: false,
      country: "México",
    },
    mode: "onChange", // Enable real-time validation
  });

  async function onSubmit(data: VendorRegistration) {
    setIsSubmitting(true);
    try {
      // TODO: Submit to API
      console.log(data);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <Image
              src="/images/logos/logo-family.png"
              alt="Luzimarket Family"
              width={180}
              height={50}
              className="mx-auto h-12 w-auto"
              priority
            />
          </div>
          
          <h2 className="text-6xl font-times-now mb-8">¡Gracias!</h2>
          
          <div className="mb-8">
            <Image
              src="/images/logos/flower-icon-1.png"
              alt="Success"
              width={100}
              height={100}
              className="mx-auto"
            />
          </div>

          <p className="text-lg font-univers text-gray-600 max-w-lg mx-auto">
            Pronto recibirás una confirmación y respuesta de parte de LUZIMARKET® para dar 
            seguimiento a tu aplicación a nuestra plataforma.
          </p>

          <p className="text-sm font-univers text-gray-500 mt-12">
            MOMENTO ESPECIAL SAPI DE CV © 2022 / TODOS LOS DERECHOS RESERVADOS
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-4">
            <Image
              src="/images/logos/logo-family.png"
              alt="Luzimarket Family"
              width={180}
              height={50}
              className="mx-auto h-12 w-auto"
              priority
            />
          </div>
          <h1 className="text-3xl font-univers tracking-wider">
          </h1>
          <h2 className="text-5xl font-times-now mb-4">Bienvenidx, Family!</h2>
          <p className="text-lg font-univers text-gray-600 max-w-2xl mx-auto">
            Llena el formulario para conocer acerca de tu marca y productos.
            LUZIMARKET® revisa minuciosamente cada aplicación para seleccionar
            los regalos handpicked que ofrecerá nuestra plataforma.
          </p>
          
          <div className="mt-8">
            <Image
              src="/images/logos/hand-gesture-icon.png"
              alt="Hand gesture"
              width={60}
              height={60}
              className="mx-auto"
            />
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Business Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-univers flex items-center gap-2">
                <span className="text-2xl">→</span> Información de la marca
              </h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputWithValidation 
                          placeholder="Nombre de la marca / tienda / negocio" 
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
                      <FormControl>
                        <InputWithValidation placeholder="Nombre del responsable / contacto" {...field} />
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
                      <FormControl>
                        <InputWithValidation type="email" placeholder="Email" {...field} />
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
                      <FormControl>
                        <InputWithValidation placeholder="Celular / Whatsapp" {...field} />
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
                      <FormControl>
                        <InputWithValidation placeholder="Teléfono de la tienda / negocio" {...field} />
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
                      <FormControl>
                        <InputWithValidation placeholder="Horarios de la tienda / negocio" {...field} />
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
                      <FormControl>
                        <InputWithValidation placeholder="Calle" {...field} />
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
                        <FormControl>
                          <InputWithValidation placeholder="Ciudad" {...field} />
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
                        <FormControl>
                          <InputWithValidation placeholder="Estado" {...field} />
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
                        <FormControl>
                          <InputWithValidation placeholder="País" {...field} />
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
                    <FormControl>
                      <InputWithValidation placeholder="URL / Página web" {...field} />
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
                    <FormControl>
                      <Textarea
                        placeholder="Describe brevemente el giro o enfoque de tu marca / negocio"
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
            <div className="space-y-6">
              <h3 className="text-xl font-univers flex items-center gap-2">
                <span className="text-2xl">→</span> Servicio a domicilio
              </h3>
              
              <div className="space-y-4">
                <p className="text-sm font-univers text-gray-600">¿Cuentas con servicio a domicilio?</p>
                
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
                            >
                              {field.value ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                            <span className="font-univers">Sí</span>
                          </label>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <button
                              type="button"
                              onClick={() => field.onChange(false)}
                              className="relative"
                            >
                              {!field.value ? (
                                <CheckCircle2 className="h-5 w-5 text-red-600" />
                              ) : (
                                <Circle className="h-5 w-5" />
                              )}
                            </button>
                            <span className="font-univers">No</span>
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
                      <span className="font-univers">Propio</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-univers">Servicio Externo</span>
                    </label>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="deliveryService"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputWithValidation placeholder="¿Qué servicio usas?" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-6">
              <h3 className="text-xl font-univers flex items-center gap-2">
                <span className="text-2xl">→</span> Social Media
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="instagramUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <InputWithValidation placeholder="Instagram" {...field} />
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
                        <InputWithValidation placeholder="Facebook" {...field} />
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
                        <InputWithValidation placeholder="TikTok" {...field} />
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
                        <InputWithValidation placeholder="Twitter" {...field} />
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
                className="bg-black text-white px-12 py-3 font-univers hover:bg-gray-800"
              >
                {isSubmitting ? "Enviando..." : "¡Listo!"}
              </Button>
            </div>
          </form>
        </Form>

        <p className="text-center text-sm font-univers text-gray-500 mt-12">
          MOMENTO ESPECIAL SAPI DE CV © 2022 / TODOS LOS DERECHOS RESERVADOS
        </p>
      </div>
    </div>
  );
}