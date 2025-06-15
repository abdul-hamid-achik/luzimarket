# Hardcoded Spanish Text Found in Luzimarket

This document lists all hardcoded Spanish text found throughout the application that should be internationalized.

## 1. Toast Messages

### File: `/components/products/product-card.tsx`
- Line 42: `toast.success("Eliminado de favoritos");`
- Line 52: `toast.success("Agregado a favoritos");`
- Line 50: `vendorName: product.vendor?.businessName || "Vendedor",`
- Line 124: `vendorName: product.vendor?.businessName || "Vendedor",`

### File: `/app/(auth)/register/page.tsx`
- Line 43: `toast.error("Credenciales inválidas");`
- Line 45: `toast.success("Inicio de sesión exitoso");`
- Line 50: `toast.error("Error al iniciar sesión");`

### File: `/app/(auth)/login/page.tsx`
- Line 43: `toast.error("Credenciales inválidas");`
- Line 45: `toast.success("Inicio de sesión exitoso");`
- Line 50: `toast.error("Error al iniciar sesión");`

### File: `/app/vendor/products/new/page.tsx`
- Line 71: `toast.success(\`${files.length} imagen(es) agregadas\`);`
- Line 73: `toast.error("Error al subir las imágenes");`
- Line 102: `throw new Error("Error al crear el producto");`
- Line 105: `toast.success("Producto creado exitosamente");`
- Line 108: `toast.error("Error al crear el producto");`

### File: `/app/admin/email-templates/new/page.tsx`
- Line 27: `toast.success("Plantilla creada exitosamente");`

### File: `/components/layout/newsletter.tsx`
- Line 37: `throw new Error("Error al suscribirse");`
- Line 40: `toast.success("¡Te has suscrito exitosamente!");`
- Line 43: `toast.error("Error al suscribirse. Intenta de nuevo.");`

## 2. Form Labels and Placeholders

### File: `/app/(auth)/register/page.tsx`
- Line 90: `<h1 className="text-2xl font-times-now mb-2">Crear cuenta</h1>`
- Line 92: `¿Ya tienes cuenta?{" "}`
- Line 94: `Iniciar sesión`
- Line 101: `<Label htmlFor="name">Nombre completo</Label>`
- Line 117: `<Label htmlFor="email">Correo electrónico</Label>`
- Line 133: `<Label htmlFor="password">Contraseña</Label>`
- Line 149: `<Label htmlFor="confirmPassword">Confirmar contraseña</Label>`
- Line 172: `Creando cuenta...`
- Line 175: `"Crear cuenta"`
- Line 181: `Al crear una cuenta, aceptas nuestros{" "}`
- Line 183: `Términos y Condiciones`
- Line 187: `Política de Privacidad`
- Line 198: `O regístrate con`

### File: `/app/(auth)/login/page.tsx`
- Line 69: `<h1 className="text-2xl font-times-now mb-2">Iniciar sesión</h1>`
- Line 71: `¿No tienes cuenta?{" "}`
- Line 73: `Regístrate`
- Line 80: `<Label htmlFor="email">Correo electrónico</Label>`
- Line 97: `<Label htmlFor="password">Contraseña</Label>`
- Line 102: `¿Olvidaste tu contraseña?`
- Line 127: `Iniciando sesión...`
- Line 130: `"Iniciar sesión"`
- Line 141: `O continúa con`

### File: `/app/vendor/products/new/page.tsx`
- Line 123: `Volver a productos`
- Line 126: `<h1 className="text-2xl font-univers text-gray-900">Agregar Nuevo Producto</h1>`
- Line 128: `Completa la información para agregar un nuevo producto a tu catálogo`
- Line 136: `<h2 className="text-lg font-univers mb-6">Información Básica</h2>`
- Line 144: `<FormLabel>Nombre del Producto</FormLabel>`
- Line 147: `placeholder="Ejemplo: Ramo de Rosas Rojas"`
- Line 164: `<FormLabel>Descripción</FormLabel>`
- Line 167: `placeholder="Describe tu producto en detalle..."`
- Line 183: `<FormLabel>Categoría</FormLabel>`
- Line 187: `<SelectValue placeholder="Selecciona una categoría" />`
- Line 191-194: Category names in Spanish
- Line 207: `<FormLabel>Etiquetas (opcional)</FormLabel>`
- Line 215: `Separa las etiquetas con comas`
- Line 226: `<h2 className="text-lg font-univers mb-6">Precio e Inventario</h2>`
- Line 234: `<FormLabel>Precio (MXN)</FormLabel>`
- Line 256: `<FormLabel>Stock Disponible</FormLabel>`
- Line 276: `<h2 className="text-lg font-univers mb-6">Imágenes del Producto</h2>`
- Line 294: `Subiendo imágenes...`
- Line 297: `"Arrastra imágenes aquí o haz clic para seleccionar"`
- Line 301: `PNG, JPG hasta 5MB`
- Line 337: `Principal`
- Line 360: `Cancelar`
- Line 370: `Creando...`
- Line 373: `"Crear Producto"`

### File: `/components/layout/newsletter.tsx`
- Line 54: `Únete a la familia Luzimarket`
- Line 57: `Recibe las últimas novedades, ofertas exclusivas y productos handpicked directamente en tu correo.`
- Line 64: `placeholder="Tu correo electrónico"`
- Line 80: `"Suscribirse"`
- Line 86: `Al suscribirte, aceptas nuestra política de privacidad`

## 3. Navigation Items

### File: `/components/layout/header.tsx`
- Line 35: `<span className="text-gray-600">Envío a: MONTERREY, NL</span>`
- Line 80: `Tiendas + Marcas`
- Line 87: `Categorías`
- Line 94: `Ocasiones`
- Line 173: `Tiendas + Marcas`
- Line 176: `Categorías`
- Line 179: `Ocasiones`

### File: `/app/vendor/layout.tsx`
- Line 42: `<p className="text-sm font-univers font-medium text-gray-900">Panel de Vendedor</p>`
- Line 63: `Mis Productos`
- Line 71: `Órdenes`
- Line 79: `Análisis`
- Line 87: `Configuración`
- Line 99: `Cerrar sesión`
- Line 110: `<h2 className="text-lg font-univers">Panel de Vendedor</h2>`

### File: `/app/admin/layout.tsx`
- Line 59: `Órdenes`
- Line 67: `Productos`
- Line 75: `Vendedores`
- Line 83: `Usuarios`
- Line 99: `Configuración`
- Line 107: `Cerrar sesión`
- Line 117: `<h2 className="text-lg font-univers">Panel de Administración</h2>`

## 4. Search Component

### File: `/components/layout/search-box.tsx`
- Line 99: `placeholder="Buscar productos, categorías o tiendas..."`
- Line 119: `Buscando...`
- Line 127: `Productos`
- Line 164: `Categorías`
- Line 188: `Tiendas`
- Line 214: `Ver todos los resultados para`
- Line 220: `No se encontraron resultados para`

## 5. Validation Messages (Zod Schemas)

### File: `/app/(auth)/register/page.tsx`
- Line 18: `z.string().min(2, "El nombre debe tener al menos 2 caracteres")`
- Line 19: `z.string().email("Correo electrónico inválido")`
- Line 20: `z.string().min(6, "La contraseña debe tener al menos 6 caracteres")`
- Line 23: `message: "Las contraseñas no coinciden"`
- Line 54: `throw new Error(result.error || "Error al registrarse");`
- Line 57: `toast.success("Cuenta creada exitosamente");`
- Line 71: `toast.error(error instanceof Error ? error.message : "Error al crear la cuenta");`

### File: `/app/(auth)/login/page.tsx`
- Line 18: `z.string().email("Correo electrónico inválido")`
- Line 19: `z.string().min(6, "La contraseña debe tener al menos 6 caracteres")`

### File: `/app/vendor/products/new/page.tsx`
- Line 20: `z.string().min(3, "El nombre debe tener al menos 3 caracteres")`
- Line 21: `z.string().min(10, "La descripción debe tener al menos 10 caracteres")`
- Line 23: `message: "El precio debe ser un número mayor a 0"`
- Line 26: `message: "El stock debe ser un número positivo"`
- Line 28: `z.string().min(1, "Selecciona una categoría")`
- Line 30: `z.array(z.string()).min(1, "Agrega al menos una imagen")`

### File: `/app/admin/email-templates/new/page.tsx`
- Line 25: `z.string().min(3, "El nombre debe tener al menos 3 caracteres")`
- Line 26: `z.string().min(1, "Selecciona un tipo de plantilla")`
- Line 27: `z.string().min(5, "El asunto debe tener al menos 5 caracteres")`
- Line 29: `z.string().min(10, "El contenido HTML es requerido")`
- Line 87: `<h2>Hola {{customer_name}},</h2>`
- Line 88: `<p>Tu contenido aquí...</p>`
- Line 91: `<p>© 2024 Luzimarket. Todos los derechos reservados.</p>`

### File: `/lib/schemas/vendor.ts`
- Line 5: `businessName: z.string().min(2, "El nombre del negocio debe tener al menos 2 caracteres")`
- Line 6: `contactName: z.string().min(2, "El nombre del responsable debe tener al menos 2 caracteres")`
- Line 7: `email: z.string().email("Email inválido")`
- Line 10: `businessPhone: z.string().min(10, "Teléfono inválido")`
- Line 14: `street: z.string().min(5, "La dirección debe tener al menos 5 caracteres")`
- Line 15: `city: z.string().min(2, "Ciudad requerida")`
- Line 16: `state: z.string().min(2, "Estado requerido")`
- Line 17: `country: z.string().min(1, "País requerido")`
- Line 22: `description: z.string().min(10, "La descripción debe tener al menos 10 caracteres")`

### File: `/lib/schemas/product.ts`
- Line 4: `name: z.string().min(2, "El nombre debe tener al menos 2 caracteres")`
- Line 5: `description: z.string().min(10, "La descripción debe tener al menos 10 caracteres")`
- Line 7: `message: "El precio debe ser un número positivo"`
- Line 9: `categoryId: z.number().positive("Selecciona una categoría")`
- Line 10: `stock: z.number().int().min(0, "El stock no puede ser negativo")`

### File: `/components/layout/newsletter.tsx`
- Line 13: `email: z.string().email("Correo electrónico inválido")`

## 6. Error Messages

Various files contain error messages in Spanish that should be internationalized for proper error handling across different locales.

## Recommendations

1. All these hardcoded Spanish strings should be moved to the internationalization files in `/i18n/messages/`
2. Use the `getTranslations()` function in server components and `useTranslations()` hook in client components
3. For Zod schemas, consider creating internationalized validation messages that can be passed dynamically based on the current locale
4. Toast messages should use translated strings
5. Form placeholders, labels, and error messages should all be internationalized
6. Navigation items and page titles should use translation keys