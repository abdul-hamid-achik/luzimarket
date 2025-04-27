
import { useState } from "react";

const statesAndCities = {
  Aguascalientes: ["Aguascalientes", "Asientos", "Calvillo"],
  "Baja California": [
    "Mexicali",
    "Tijuana",
    "Ensenada",
    "Tecate",
    "Playas de Rosarito",
  ],
  "Baja California Sur": ["La Paz", "Comondú", "Mulegé", "Loreto", "Los Cabos"],
  Campeche: ["Campeche", "Carmen", "Champotón", "Hecelchakán", "Hopelchén"],
  Chiapas: [
    "Tuxtla Gutiérrez",
    "San Cristóbal de las Casas",
    "Tapachula",
    "Comitán",
    "Chiapa de Corzo",
  ],
  Chihuahua: [
    "Chihuahua",
    "Ciudad Juárez",
    "Delicias",
    "Hidalgo del Parral",
    "Nuevo Casas Grandes",
  ],
  "Ciudad de México": [
    "Álvaro Obregón",
    "Coyoacán",
    "Cuajimalpa",
    "Gustavo A. Madero",
    "Iztacalco",
  ],
  "Coahuila de Zaragoza": [
    "Saltillo",
    "Torreón",
    "Monclova",
    "Piedras Negras",
    "San Pedro",
  ],
  Colima: ["Colima", "Manzanillo", "Tecomán", "Villa de Álvarez", "Comala"],
  Durango: [
    "Durango",
    "Gómez Palacio",
    "Lerdo",
    "Pueblo Nuevo",
    "Guadalupe Victoria",
  ],
  "Estado de México": [
    "Toluca",
    "Ecatepec",
    "Nezahualcóyotl",
    "Naucalpan",
    "Tlalnepantla de Baz",
  ],
  Guanajuato: ["León", "Irapuato", "Celaya", "Salamanca", "Guanajuato"],
  Guerrero: ["Acapulco", "Chilpancingo", "Iguala", "Zihuatanejo", "Taxco"],
  Hidalgo: ["Pachuca", "Tulancingo", "Huejutla", "Tizayuca", "Ixmiquilpan"],
  Jalisco: [
    "Guadalajara",
    "Zapopan",
    "Tlaquepaque",
    "Tonalá",
    "Puerto Vallarta",
  ],
  "Michoacán de Ocampo": [
    "Morelia",
    "Uruapan",
    "Zamora",
    "Apatzingán",
    "Zitácuaro",
  ],
  Morelos: ["Cuernavaca", "Cuautla", "Jiutepec", "Temixco", "Yautepec"],
  Nayarit: [
    "Tepic",
    "Xalisco",
    "Tuxpan",
    "Santiago Ixcuintla",
    "Bahía de Banderas",
  ],
  "Nuevo León": [
    "Monterrey",
    "Guadalupe",
    "San Nicolás de los Garza",
    "Apodaca",
    "General Escobedo",
  ],
  Oaxaca: [
    "Oaxaca",
    "San Juan Bautista Tuxtepec",
    "Juchitán de Zaragoza",
    "Salina Cruz",
    "Santa Cruz Xoxocotlán",
  ],
  Puebla: [
    "Puebla",
    "Tehuacán",
    "San Martín Texmelucan",
    "Atlixco",
    "San Pedro Cholula",
  ],
  Querétaro: [
    "Querétaro",
    "San Juan del Río",
    "Corregidora",
    "El Marqués",
    "Cadereyta de Montes",
  ],
  "Quintana Roo": [
    "Cancún",
    "Chetumal",
    "Playa del Carmen",
    "Cozumel",
    "Tulum",
  ],
  "San Luis Potosí": [
    "San Luis Potosí",
    "Soledad de Graciano Sánchez",
    "Ciudad Valles",
    "Matehuala",
    "Rioverde",
  ],
  Sinaloa: ["Culiacán", "Mazatlán", "Los Mochis", "Guasave", "Navolato"],
  Sonora: [
    "Hermosillo",
    "Ciudad Obregón",
    "Nogales",
    "San Luis Río Colorado",
    "Navojoa",
  ],
  Tabasco: [
    "Villahermosa",
    "Cárdenas",
    "Comalcalco",
    "Cunduacán",
    "Huimanguillo",
  ],
  Tamaulipas: [
    "Reynosa",
    "Matamoros",
    "Nuevo Laredo",
    "Tampico",
    "Ciudad Victoria",
  ],
  Tlaxcala: ["Tlaxcala", "Apizaco", "Huamantla", "Zacatelco", "Chiautempan"],
  "Veracruz de Ignacio de la Llave": [
    "Veracruz",
    "Xalapa",
    "Córdoba",
    "Orizaba",
    "Coatzacoalcos",
  ],
  Yucatán: ["Mérida", "Progreso", "Tizimín", "Valladolid", "Motul"],
  Zacatecas: ["Zacatecas", "Fresnillo", "Guadalupe", "Jerez", "Río Grande"],
};

function SelectComponent() {
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const handleStateChange = (event) => {
    setSelectedState(event.target.value);
    setSelectedCity(""); // Resetea la ciudad seleccionada cuando se cambia el estado
  };

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
  };

  return (
    <div className="row">
      <div className="col-md-4 mb-3">
        <select
          className="form-select rounded rounded-5 shadow p-3 w-100"
          value={selectedState}
          onChange={handleStateChange}
        >
          <option value="">Estado</option>
          {Object.keys(statesAndCities).map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      <div className="col-md-4 mb-2">
        <select
          className="form-select rounded rounded-5 shadow p-3"
          value={selectedCity}
          onChange={handleCityChange}
        >
          <option value="">Ciudad</option>
          {statesAndCities[selectedState]?.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default SelectComponent;
