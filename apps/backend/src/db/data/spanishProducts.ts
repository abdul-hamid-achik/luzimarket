// Comprehensive Spanish product catalog for Mexican market
// Prices are in centavos (Mexican pesos * 100)

export interface ProductData {
    name: string;
    description: string;
    price: number; // in centavos
    categorySlug: string;
}

export const spanishCategories = [
    {
        name: 'Arreglos Florales',
        slug: 'floral-arrangements',
        description: 'Hermosos arreglos florales frescos para toda ocasión, desde rosas clásicas hasta composiciones únicas que expresan tus sentimientos más profundos.'
    },
    {
        name: 'Canastas de Regalo',
        slug: 'gift-baskets',
        description: 'Canastas cuidadosamente seleccionadas con los mejores productos gourmet, frutas frescas y detalles especiales para sorprender a tus seres queridos.'
    },
    {
        name: 'Delicias Gourmet',
        slug: 'gourmet-treats',
        description: 'Exquisitos chocolates artesanales, dulces tradicionales y manjares gourmet que deleitan el paladar más exigente.'
    },
    {
        name: 'Decoración para el Hogar',
        slug: 'home-decor-gifts',
        description: 'Elegantes piezas decorativas, jarrones únicos y accesorios para el hogar que transforman cualquier espacio en un lugar especial.'
    },
    {
        name: 'Regalos Personalizados',
        slug: 'personalized-gifts',
        description: 'Regalos únicos con grabados personalizados, nombres y mensajes especiales que hacen de cada obsequio algo verdaderamente memorable.'
    },
    {
        name: 'Aromaterapia y Bienestar',
        slug: 'aromatherapy-wellness',
        description: 'Productos de relajación, aceites esenciales y velas aromáticas para crear un ambiente de paz y tranquilidad en tu hogar.'
    },
    {
        name: 'Especiales de Temporada',
        slug: 'seasonal-specials',
        description: 'Colecciones especiales para cada época del año, desde decoraciones navideñas hasta regalos de temporada que celebran cada momento especial.'
    },
    {
        name: 'Regalos de Lujo',
        slug: 'luxury-gifts',
        description: 'Selección premium de regalos exclusivos y elegantes para ocasiones especiales que requieren un toque de distinción y sofisticación.'
    },
    {
        name: 'Artesanías Mexicanas',
        slug: 'handcrafted-items',
        description: 'Hermosas piezas artesanales hechas por talentosos artesanos mexicanos, cada una única y llena de tradición y cultura.'
    },
    {
        name: 'Regalos Ecológicos',
        slug: 'eco-friendly-gifts',
        description: 'Productos sustentables y amigables con el medio ambiente, perfectos para quienes valoran la naturaleza y el cuidado del planeta.'
    }
];

export const spanishOccasions = [
    {
        name: 'Cumpleaños',
        description: 'Celebra un año más de vida con nuestros regalos especiales que harán de este día una fecha inolvidable llena de alegría y sorpresas.',
        slug: 'cumpleanos'
    },
    {
        name: 'Aniversario',
        description: 'Conmemora años de amor y compromiso con nuestra selección romántica que honra la historia de amor que han construido juntos.',
        slug: 'aniversario'
    },
    {
        name: 'Graduación',
        description: 'Honra los logros académicos con regalos que celebran el esfuerzo, la dedicación y el brillante futuro que les espera.',
        slug: 'graduacion'
    },
    {
        name: 'Navidad',
        description: 'Comparte la magia navideña con nuestra colección festiva que llena de calidez y alegría estas fechas tan especiales.',
        slug: 'navidad'
    },
    {
        name: 'Día de las Madres',
        description: 'Demuestra tu amor y gratitud hacia mamá con regalos que expresan todo lo que significa para ti en su día especial.',
        slug: 'dia-de-las-madres'
    },
    {
        name: 'Día del Padre',
        description: 'Celebra a papá con obsequios que reconocen su amor, sacrificio y la guía que ha sido en tu vida.',
        slug: 'dia-del-padre'
    },
    {
        name: 'San Valentín',
        description: 'Expresa tu amor con nuestra colección romántica que habla el lenguaje del corazón en el día de los enamorados.',
        slug: 'san-valentin'
    },
    {
        name: 'Boda',
        description: 'Celebra el inicio de una nueva vida juntos con regalos elegantes que acompañarán a la pareja en esta hermosa etapa.',
        slug: 'boda'
    },
    {
        name: 'Bautizo',
        description: 'Marca este momento sagrado con regalos especiales que acompañarán al pequeño en su camino espiritual.',
        slug: 'bautizo'
    },
    {
        name: 'Baby Shower',
        description: 'Da la bienvenida al nuevo integrante de la familia con tiernos regalos que celebran la llegada del bebé.',
        slug: 'baby-shower'
    },
    {
        name: 'Inauguración',
        description: 'Celebra nuevos hogares y negocios con regalos que traen buena suerte y prosperidad a estos nuevos comienzos.',
        slug: 'inauguracion'
    },
    {
        name: 'Jubilación',
        description: 'Honra una carrera exitosa con regalos que celebran los logros profesionales y el merecido descanso.',
        slug: 'jubilacion'
    }
];

export const spanishProducts: ProductData[] = [
    // Arreglos Florales
    {
        name: 'Ramo de Rosas Rojas Premium',
        description: 'Elegante ramo de 24 rosas rojas ecuatorianas de tallo largo, símbolo perfecto del amor verdadero. Incluye follaje verde y presentación en papel kraft con moño de seda.',
        price: 89900, // $899 pesos
        categorySlug: 'floral-arrangements'
    },
    {
        name: 'Arreglo Floral Primaveral',
        description: 'Colorido arreglo con gerberas, alstroemerias y flores de temporada en tonos vibrantes. Perfecto para alegrar cualquier espacio con la frescura de la primavera.',
        price: 65000, // $650 pesos
        categorySlug: 'floral-arrangements'
    },
    {
        name: 'Ramo de Girasoles Mexicanos',
        description: 'Radiante ramo de girasoles frescos que transmite alegría y energía positiva. Acompañado de follaje natural y presentación rústica con arpillera.',
        price: 55000, // $550 pesos
        categorySlug: 'floral-arrangements'
    },
    {
        name: 'Arreglo de Orquídeas Blancas',
        description: 'Sofisticado arreglo con orquídeas phalaenopsis blancas en base de cristal. Elegancia pura que perdura por semanas con el cuidado adecuado.',
        price: 125000, // $1,250 pesos
        categorySlug: 'floral-arrangements'
    },
    {
        name: 'Ramo Mixto de Flores Silvestres',
        description: 'Encantador ramo con flores silvestres de la región, incluyendo margaritas, statice y follaje campestre. Naturaleza en su máxima expresión.',
        price: 45000, // $450 pesos
        categorySlug: 'floral-arrangements'
    },

    // Canastas de Regalo
    {
        name: 'Canasta Gourmet Deluxe',
        description: 'Exquisita selección de quesos artesanales, vinos mexicanos, chocolates premium, frutas secas y mermeladas caseras en elegante canasta de mimbre.',
        price: 185000, // $1,850 pesos
        categorySlug: 'gift-baskets'
    },
    {
        name: 'Canasta de Frutas Tropicales',
        description: 'Generosa selección de frutas tropicales frescas: piña, mango, papaya, plátanos y frutas de temporada en canasta decorativa con moño.',
        price: 75000, // $750 pesos
        categorySlug: 'gift-baskets'
    },
    {
        name: 'Canasta de Bienestar y Relajación',
        description: 'Kit completo de relajación con sales de baño, velas aromáticas, té herbal, miel orgánica y productos naturales para el cuidado personal.',
        price: 95000, // $950 pesos
        categorySlug: 'gift-baskets'
    },
    {
        name: 'Canasta del Café Mexicano',
        description: 'Selección de los mejores cafés mexicanos de Chiapas, Veracruz y Oaxaca, acompañados de galletas artesanales y taza de cerámica talavera.',
        price: 85000, // $850 pesos
        categorySlug: 'gift-baskets'
    },

    // Delicias Gourmet
    {
        name: 'Chocolates Artesanales Mexicanos',
        description: 'Caja de 20 chocolates artesanales con sabores únicos: chile, vainilla, café de olla, amaranto y cacao puro. Tradición mexicana en cada bocado.',
        price: 65000, // $650 pesos
        categorySlug: 'gourmet-treats'
    },
    {
        name: 'Dulces Tradicionales de México',
        description: 'Selección de dulces típicos mexicanos: cocadas, alegrías, palanquetas, jamoncillos y dulces de leche. Nostalgia y sabor en cada pieza.',
        price: 45000, // $450 pesos
        categorySlug: 'gourmet-treats'
    },
    {
        name: 'Miel Orgánica con Propóleo',
        description: 'Miel pura de abeja melipona mexicana con propóleo natural. Producto 100% orgánico con propiedades medicinales y sabor excepcional.',
        price: 35000, // $350 pesos
        categorySlug: 'gourmet-treats'
    },
    {
        name: 'Trufas de Chocolate Belga',
        description: 'Exquisitas trufas de chocolate belga con rellenos de licores premium, frutas y especias. Presentación en caja de regalo elegante.',
        price: 85000, // $850 pesos
        categorySlug: 'gourmet-treats'
    },

    // Decoración para el Hogar
    {
        name: 'Jarrón de Talavera Poblana',
        description: 'Hermoso jarrón de cerámica talavera poblana pintado a mano con diseños tradicionales en azul y blanco. Pieza única de arte mexicano.',
        price: 125000, // $1,250 pesos
        categorySlug: 'home-decor-gifts'
    },
    {
        name: 'Set de Velas Aromáticas Artesanales',
        description: 'Conjunto de 3 velas de cera de soya con aromas de lavanda, vainilla y sándalo. Hechas a mano con mechas de algodón natural.',
        price: 55000, // $550 pesos
        categorySlug: 'home-decor-gifts'
    },
    {
        name: 'Espejo Decorativo con Marco de Madera',
        description: 'Elegante espejo con marco de madera tallada a mano con motivos florales. Perfecto para dar amplitud y estilo a cualquier habitación.',
        price: 95000, // $950 pesos
        categorySlug: 'home-decor-gifts'
    },
    {
        name: 'Maceta de Barro con Suculentas',
        description: 'Hermosa maceta de barro natural con selección de suculentas mexicanas. Incluye piedras decorativas y tarjeta de cuidados.',
        price: 35000, // $350 pesos
        categorySlug: 'home-decor-gifts'
    },

    // Regalos Personalizados
    {
        name: 'Marco de Fotos Grabado Personalizado',
        description: 'Elegante marco de madera con grabado láser personalizado. Incluye nombres, fechas o mensaje especial. Ideal para bodas y aniversarios.',
        price: 65000, // $650 pesos
        categorySlug: 'personalized-gifts'
    },
    {
        name: 'Taza Personalizada con Foto',
        description: 'Taza de cerámica de alta calidad con impresión de foto y mensaje personalizado. Resistente al microondas y lavavajillas.',
        price: 25000, // $250 pesos
        categorySlug: 'personalized-gifts'
    },
    {
        name: 'Llavero de Plata con Grabado',
        description: 'Llavero de plata .925 con grabado personalizado de iniciales o fecha especial. Incluye cadena resistente y caja de regalo.',
        price: 45000, // $450 pesos
        categorySlug: 'personalized-gifts'
    },
    {
        name: 'Álbum de Fotos Personalizado',
        description: 'Álbum de fotos con portada personalizada en cuero sintético. 50 páginas para preservar los momentos más especiales.',
        price: 85000, // $850 pesos
        categorySlug: 'personalized-gifts'
    },

    // Aromaterapia y Bienestar
    {
        name: 'Kit de Aceites Esenciales Mexicanos',
        description: 'Set de 6 aceites esenciales extraídos de plantas mexicanas: eucalipto, menta, lavanda, romero, naranja y limón. Incluye difusor de bambú.',
        price: 95000, // $950 pesos
        categorySlug: 'aromatherapy-wellness'
    },
    {
        name: 'Sales de Baño del Mar Muerto',
        description: 'Sales minerales del Mar Muerto enriquecidas con aceites esenciales de relajación. Perfectas para un baño revitalizante y terapéutico.',
        price: 45000, // $450 pesos
        categorySlug: 'aromatherapy-wellness'
    },
    {
        name: 'Difusor Ultrasónico de Aromas',
        description: 'Difusor eléctrico con tecnología ultrasónica, luces LED de colores y temporizador. Incluye aceite esencial de lavanda de regalo.',
        price: 75000, // $750 pesos
        categorySlug: 'aromatherapy-wellness'
    },
    {
        name: 'Vela de Masaje con Aceites Naturales',
        description: 'Vela especial que se convierte en aceite tibio para masajes. Elaborada con cera de soya y aceites esenciales relajantes.',
        price: 55000, // $550 pesos
        categorySlug: 'aromatherapy-wellness'
    },

    // Especiales de Temporada
    {
        name: 'Corona Navideña Artesanal',
        description: 'Hermosa corona navideña hecha a mano con ramas naturales, piñas, frutos rojos y moño dorado. Perfecta para decorar la puerta de entrada.',
        price: 65000, // $650 pesos
        categorySlug: 'seasonal-specials'
    },
    {
        name: 'Arreglo de Día de Muertos',
        description: 'Tradicional arreglo con cempasúchil, velas y elementos decorativos típicos del Día de Muertos. Honra a tus seres queridos con tradición.',
        price: 55000, // $550 pesos
        categorySlug: 'seasonal-specials'
    },
    {
        name: 'Canasta de Pascua',
        description: 'Colorida canasta con huevos de chocolate, dulces tradicionales y decoraciones pascuales. Alegría primaveral para toda la familia.',
        price: 75000, // $750 pesos
        categorySlug: 'seasonal-specials'
    },

    // Regalos de Lujo
    {
        name: 'Arreglo Floral Premium con Rosas Importadas',
        description: 'Exclusivo arreglo con 50 rosas rojas importadas de Ecuador, follaje exótico y presentación en caja de lujo con moño de seda.',
        price: 250000, // $2,500 pesos
        categorySlug: 'luxury-gifts'
    },
    {
        name: 'Joyero de Madera Fina',
        description: 'Elegante joyero de madera de nogal con compartimentos forrados en terciopelo. Incluye espejo y cerradura con llave dorada.',
        price: 185000, // $1,850 pesos
        categorySlug: 'luxury-gifts'
    },
    {
        name: 'Set de Copas de Cristal Cortado',
        description: 'Juego de 6 copas de cristal cortado a mano con diseños geométricos. Perfectas para ocasiones especiales y celebraciones elegantes.',
        price: 165000, // $1,650 pesos
        categorySlug: 'luxury-gifts'
    },

    // Artesanías Mexicanas
    {
        name: 'Reboza Tradicional de Santa María',
        description: 'Auténtico rebozo tejido a mano en Santa María del Río, San Luis Potosí. Técnica ancestral con hilos de seda y algodón natural.',
        price: 145000, // $1,450 pesos
        categorySlug: 'handcrafted-items'
    },
    {
        name: 'Máscara de Madera Oaxaqueña',
        description: 'Hermosa máscara tallada en madera de copal por artesanos zapotecos. Pintada a mano con colores tradicionales y motivos prehispánicos.',
        price: 85000, // $850 pesos
        categorySlug: 'handcrafted-items'
    },
    {
        name: 'Huipil Bordado a Mano',
        description: 'Tradicional huipil bordado a mano por artesanas chiapanecas. Diseños florales únicos que representan la riqueza cultural mexicana.',
        price: 195000, // $1,950 pesos
        categorySlug: 'handcrafted-items'
    },
    {
        name: 'Alebrije de Madera Tallada',
        description: 'Fantástico alebrije tallado en madera de copal y pintado con colores vibrantes. Cada pieza es única y llena de imaginación oaxaqueña.',
        price: 125000, // $1,250 pesos
        categorySlug: 'handcrafted-items'
    },

    // Regalos Ecológicos
    {
        name: 'Kit de Cultivo Orgánico',
        description: 'Set completo para cultivar hierbas aromáticas en casa. Incluye semillas orgánicas, macetas biodegradables y tierra especial.',
        price: 45000, // $450 pesos
        categorySlug: 'eco-friendly-gifts'
    },
    {
        name: 'Bolsas Reutilizables de Algodón',
        description: 'Set de 5 bolsas de algodón orgánico con diseños mexicanos. Perfectas para compras sustentables y cuidado del medio ambiente.',
        price: 35000, // $350 pesos
        categorySlug: 'eco-friendly-gifts'
    },
    {
        name: 'Jabones Artesanales Naturales',
        description: 'Colección de 6 jabones hechos con ingredientes naturales mexicanos: sábila, coco, avena, miel, carbón activado y caléndula.',
        price: 55000, // $550 pesos
        categorySlug: 'eco-friendly-gifts'
    },
    {
        name: 'Termo de Bambú Ecológico',
        description: 'Termo térmico hecho de bambú natural con interior de acero inoxidable. Mantiene bebidas calientes por 12 horas y frías por 24 horas.',
        price: 65000, // $650 pesos
        categorySlug: 'eco-friendly-gifts'
    }
]; 