import "@/css/fonts.css"

import { productDetails } from '@/data/productDetails';

const CollapseDetails = ({ product }) => {
   // Lookup accordion sections for this product
   const sections = productDetails[product.id] || [];
   const accordionId = `accordion-${product.id}`;
   return (
      <>
         <div className="card" style={{ width: '30rem' }}>
            <div className="card-body">
               <h5 className="card-title">{product.name}</h5>
               <h6 className="card-subtitle mb-2 text-muted">{product.category || ''}</h6>
               <h6 className="card-subtitle mb-2 text-muted">${product.price.toFixed(2)}</h6>
               <p className="card-text">{product.description}</p>
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
               </div>
            </div>
         </div>
         {/* <Card style={{styles, marginLeft: '1.5rem'}}>
      <Card.Body>
         <Card.Title>Producto 1</Card.Title>
         <Card.Subtitle className="mb-2 text-muted">HAY DESIGN</Card.Subtitle>
         <Card.Subtitle className="mb-2 text-muted">$1,500</Card.Subtitle>
         <Card.Text className='mt-4'>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
            enim ad minim veniam, quis nostrud exercitation ullamco laboris
            nisi ut aliquip ex ea commodo consequat.
         </Card.Text>
      </Card.Body>
      <Card.Body>
         <Collapse.Group>
               <Collapse title={<span style={{fontSize: '17px'}}>Caracteristicas</span>}>
                  <Text>
                     Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                     eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                     minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                     aliquip ex ea commodo consequat.
                  </Text>
               </Collapse>
            <Collapse title={<span style={{fontSize: '17px'}}>Eventos y Devoluciones</span>}>
               <Text>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                  eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad
                  minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat.
               </Text>
            </Collapse>
         </Collapse.Group>
      </Card.Body>
    </Card> */}
      </>
   );
}

export default CollapseDetails;