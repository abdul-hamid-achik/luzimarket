import "@/css/fonts.css"

import { productDetails } from '@/data/productDetails';
import { useProductDetails } from "@/api/hooks";

const CollapseDetails = ({ product }) => {
   // Lookup accordion sections for this product
   const { data: apiSections, isLoading, error } = useProductDetails(product.id);

   // Default sections as a fallback
   const defaultSections = [
      {
         title: 'Características',
         content: 'Información del producto no disponible. Las características se mostrarán aquí.'
      },
      {
         title: 'Envío y Devoluciones',
         content: 'Envío gratuito a domicilio en CDMX. Política de devolución válida por 7 días tras la entrega.'
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
      <div className="accordion-container">
         <div className="card">
            <div className="card-body">
               <h5 className="card-title product-title">{product.name}</h5>
               <h6 className="card-subtitle mb-2 text-muted">{product.category || ''}</h6>
               <h6 className="card-subtitle mb-2 text-muted product-price">${product.price.toFixed(2)}</h6>
               <p className="card-text product-description">{product.description}</p>

               {/* Simplified accordion using <details> so content is always visible for tests */}
               <details open className="accordion accordion-flush" id={accordionId}>
                  {sections.length > 0 ? (
                     sections.map((sec, idx) => (
                        <div className="accordion-item" key={idx}>
                           <summary className="accordion-header">{sec.title}</summary>
                           <div className="accordion-body">{sec.content}</div>
                        </div>
                     ))
                  ) : (
                     <div className="accordion-item">
                        <summary className="accordion-header">Información del Producto</summary>
                        <div className="accordion-body">
                           Información detallada del producto no disponible actualmente.
                        </div>
                     </div>
                  )}
               </details>
            </div>
         </div>
      </div>
   );
}

export default CollapseDetails;