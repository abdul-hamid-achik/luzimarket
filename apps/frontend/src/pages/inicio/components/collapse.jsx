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

               {/* Accordion with all necessary class names for test selectors */}
               <div className="accordion accordion-flush" id={accordionId}>
                  {sections.map((sec, idx) => {
                     const hdrId = `heading-${product.id}-${idx}`;
                     const collapseId = `collapse-${product.id}-${idx}`;
                     return (
                        <div className="accordion-item" key={idx}>
                           <h2 className="accordion-header" id={hdrId}>
                              <button
                                 className={`accordion-button ${idx !== 0 ? 'collapsed' : ''}`}
                                 type="button"
                                 data-bs-toggle="collapse"
                                 data-bs-target={`#${collapseId}`}
                                 aria-expanded={idx === 0}
                                 aria-controls={collapseId}
                              >
                                 {sec.title}
                              </button>
                           </h2>
                           <div
                              id={collapseId}
                              className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                              aria-labelledby={hdrId}
                              data-bs-parent={`#${accordionId}`}
                           >
                              <div className="accordion-body">
                                 {sec.content}
                              </div>
                           </div>
                        </div>
                     );
                  })}

                  {/* Fallback for when sections are empty */}
                  {sections.length === 0 && (
                     <div className="accordion-item">
                        <h2 className="accordion-header">
                           <button
                              className="accordion-button"
                              type="button"
                              data-bs-toggle="collapse"
                              data-bs-target="#collapseDefault"
                              aria-expanded="true"
                              aria-controls="collapseDefault"
                           >
                              Información del Producto
                           </button>
                        </h2>
                        <div
                           id="collapseDefault"
                           className="accordion-collapse collapse show"
                           data-bs-parent={`#${accordionId}`}
                        >
                           <div className="accordion-body">
                              Información detallada del producto no disponible actualmente.
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}

export default CollapseDetails;