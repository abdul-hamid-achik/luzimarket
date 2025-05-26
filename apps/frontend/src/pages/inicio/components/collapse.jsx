import "@/css/fonts.css"

import { productDetails } from '@/data/productDetails';
import { useProductDetails } from "@/api/hooks";

const CollapseDetails = ({ product }) => {
   // Lookup accordion sections for this product
   const { data: apiSections, isLoading, error } = useProductDetails(product.id);

   // Generate dynamic delivery content based on user's selected delivery zone
   const getDeliveryContent = () => {
      if (product.delivery_info?.user_delivery_zone) {
         const userZone = product.delivery_info.user_delivery_zone;
         const deliveryFee = (userZone.fee / 100).toFixed(2);
         const freeShippingThreshold = 1000; // $1000 pesos
         const productPrice = (product.price / 100);

         let deliveryText = '';
         if (userZone.fee === 0 || productPrice >= freeShippingThreshold) {
            deliveryText = `Envío gratuito a domicilio en ${userZone.name}.`;
         } else {
            deliveryText = `Costo de envío a ${userZone.name}: $${deliveryFee}. Envío gratis en compras mayores a $${freeShippingThreshold}.`;
         }

         return `${deliveryText} Política de devolución válida por 7 días tras la entrega.`;
      } else {
         return 'Selecciona tu zona de entrega para ver los costos de envío. Política de devolución válida por 7 días tras la entrega.';
      }
   };

   // Default sections as a fallback
   const defaultSections = [
      {
         title: 'Características',
         content: 'Información del producto no disponible. Las características se mostrarán aquí.'
      },
      {
         title: 'Envío y Devoluciones',
         content: getDeliveryContent()
      },
      {
         title: 'Especificaciones',
         content: 'Especificaciones del producto no disponibles actualmente.'
      }
   ];

   // Use API sections when available, otherwise fallback to local data or default sections
   const sections = (apiSections && apiSections.length > 0)
      ? apiSections
      : (productDetails[product.id] || defaultSections);

   const accordionId = `accordion-${product.id}`;

   return (
      <div className="product-details-accordion">
         <div className="accordion-header-section">
            <h3 className="details-title">Detalles del Producto</h3>
            <p className="details-subtitle">Información completa sobre este producto</p>
         </div>

         <div className="modern-accordion">
            {sections.length > 0 ? (
               sections.map((sec, idx) => (
                  <details key={idx} className="accordion-item-modern" open={idx === 0}>
                     <summary className="accordion-summary">
                        <span className="summary-text">{sec.title}</span>
                        <span className="summary-icon">+</span>
                     </summary>
                     <div className="accordion-content">
                        <p>{sec.content}</p>
                     </div>
                  </details>
               ))
            ) : (
               <details className="accordion-item-modern" open>
                  <summary className="accordion-summary">
                     <span className="summary-text">Información del Producto</span>
                     <span className="summary-icon">+</span>
                  </summary>
                  <div className="accordion-content">
                     <p>Información detallada del producto no disponible actualmente.</p>
                  </div>
               </details>
            )}
         </div>
      </div>
   );
}

export default CollapseDetails;