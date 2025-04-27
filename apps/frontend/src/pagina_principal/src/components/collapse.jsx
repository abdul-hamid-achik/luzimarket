//import Card from 'react-bootstrap/Card';
// import { Collapse, Text } from "@nextui-org/react";
import "../../../css/fonts.css"

const styles = {
   width: '18rem', //18rem
   height: 'min-content',
   fontFamily: 'UniLTProL, sans-serif',
   marginLeft: '1rem'
}

const CollapseDetails = () => {
   return (
      <>
         <div className="card" style={{ width: "30rem" }}>
            <div className="card-body">
               <h5 className="card-title">Tenis Nike Air</h5>
               <h6 className="card-subtitle mb-2 text-muted">NIKE</h6>
               <h6 className="card-subtitle mb-2 text-muted">$1,550</h6>
               <p className="card-text">Some quick example text to build on the card title and make up the bulk of the card's content.</p>
               <div className="accordion accordion-flush" id="accordionFlushExample">
                  <div className="accordion-item">
                     <h2 className="accordion-header" id="flush-headingOne">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseOne" aria-expanded="false" aria-controls="flush-collapseOne">
                           Accordion Item #1
                        </button>
                     </h2>
                     <div id="flush-collapseOne" className="accordion-collapse collapse" aria-labelledby="flush-headingOne" data-bs-parent="#accordionFlushExample">
                        <div className="accordion-body">Placeholder content for this accordion, which is intended to demonstrate the <code>.accordion-flush</code> className. This is the first item's accordion body.</div>
                     </div>
                  </div>
                  <div className="accordion-item">
                     <h2 className="accordion-header" id="flush-headingTwo">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseTwo" aria-expanded="false" aria-controls="flush-collapseTwo">
                           Accordion Item #2
                        </button>
                     </h2>
                     <div id="flush-collapseTwo" className="accordion-collapse collapse" aria-labelledby="flush-headingTwo" data-bs-parent="#accordionFlushExample">
                        <div className="accordion-body">Placeholder content for this accordion, which is intended to demonstrate the <code>.accordion-flush</code> className. This is the second item's accordion body. Let's imagine this being filled with some actual content.</div>
                     </div>
                  </div>
                  <div className="accordion-item">
                     <h2 className="accordion-header" id="flush-headingThree">
                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#flush-collapseThree" aria-expanded="false" aria-controls="flush-collapseThree">
                           Accordion Item #3
                        </button>
                     </h2>
                     <div id="flush-collapseThree" className="accordion-collapse collapse" aria-labelledby="flush-headingThree" data-bs-parent="#accordionFlushExample">
                        <div className="accordion-body">Placeholder content for this accordion, which is intended to demonstrate the <code>.accordion-flush</code> className. This is the third item's accordion body. Nothing more exciting happening here in terms of content, but just filling up the space to make it look, at least at first glance, a bit more representative of how this would look in a real-world application.</div>
                     </div>
                  </div>
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