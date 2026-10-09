/**
 * @description Estructura de Ubigeo territorial de los 25 departamentos de Perú
 * (24 departamentos + Callao) con provincias, distritos y coordenadas geográficas.
 */

export interface ProvinciaUbigeo {
  nombre: string;
  centro?: { lat: number; lng: number };
  distritos: string[];
}

export interface DepartamentoUbigeo {
  nombre: string;
  centro: { lat: number; lng: number };
  provincias: ProvinciaUbigeo[];
}

export const DEPARTAMENTOS_PERU: DepartamentoUbigeo[] = [
  {
    nombre: 'Amazonas',
    centro: { lat: -6.2317, lng: -77.869 },
    provincias: [
      { nombre: 'Chachapoyas', centro: { lat: -6.2317, lng: -77.869 }, distritos: ['Chachapoyas', 'Asunción', 'Balsas', 'Cheto', 'Leymebamba', 'Maino'] },
      { nombre: 'Bagua', centro: { lat: -5.6394, lng: -78.5311 }, distritos: ['Bagua', 'Aramango', 'Copallín', 'El Parco', 'Imaza', 'La Peca'] },
      { nombre: 'Utcubamba', centro: { lat: -5.7556, lng: -78.4442 }, distritos: ['Bagua Grande', 'Cajaruro', 'Cumba', 'El Milagro', 'Jamalca', 'Lonya Grande'] },
    ],
  },
  {
    nombre: 'Áncash',
    centro: { lat: -9.5278, lng: -77.5278 },
    provincias: [
      { nombre: 'Huaraz', centro: { lat: -9.5278, lng: -77.5278 }, distritos: ['Huaraz', 'Independencia', 'Cochabamba', 'Colcabamba', 'Jangas', 'Olleros', 'Tarica'] },
      { nombre: 'Santa', centro: { lat: -9.0744, lng: -78.5936 }, distritos: ['Chimbote', 'Nuevo Chimbote', 'Coishco', 'Macate', 'Moro', 'Nepeña', 'Samanco', 'Santa'] },
      { nombre: 'Casma', centro: { lat: -9.4728, lng: -78.3117 }, distritos: ['Casma', 'Buena Vista Alta', 'Comandante Noel', 'Yaután'] },
      { nombre: 'Huarmey', centro: { lat: -10.0681, lng: -78.1522 }, distritos: ['Huarmey', 'Cochapeti', 'Culebras', 'Huayán', 'Malvas'] },
    ],
  },
  {
    nombre: 'Apurímac',
    centro: { lat: -13.6339, lng: -72.8814 },
    provincias: [
      { nombre: 'Abancay', centro: { lat: -13.6339, lng: -72.8814 }, distritos: ['Abancay', 'Chacoche', 'Circa', 'Curahuasi', 'Huanipaca', 'Lambrama', 'Pichirhua', 'Tamburco'] },
      { nombre: 'Andahuaylas', centro: { lat: -13.6556, lng: -73.3872 }, distritos: ['Andahuaylas', 'Kishuará', 'Pacucha', 'San Jerónimo', 'Santa María de Chicmo', 'Talavera'] },
    ],
  },
  {
    nombre: 'Arequipa',
    centro: { lat: -16.409, lng: -71.5375 },
    provincias: [
      { nombre: 'Arequipa', centro: { lat: -16.409, lng: -71.5375 }, distritos: ['Arequipa', 'Alto Selva Alegre', 'Cayma', 'Cerro Colorado', 'La Joya', 'Miraflores', 'Paucarpata', 'Sachaca', 'Socabaya', 'Tiabaya', 'Yanahuara', 'Yura'] },
      { nombre: 'Camaná', centro: { lat: -16.6231, lng: -72.7111 }, distritos: ['Camaná', 'José María Quimper', 'Mariscal Cáceres', 'Nicolás de Piérola', 'Ocoña', 'Quilca', 'Samuel Pastor'] },
      { nombre: 'Islay', centro: { lat: -17.0219, lng: -72.0153 }, distritos: ['Mollendo', 'Cocachacra', 'Dean Valdivia', 'Islay', 'Mejía', 'Punta de Bombón'] },
    ],
  },
  {
    nombre: 'Ayacucho',
    centro: { lat: -13.1631, lng: -74.2236 },
    provincias: [
      { nombre: 'Huamanga', centro: { lat: -13.1631, lng: -74.2236 }, distritos: ['Ayacucho', 'Acocro', 'Carmen Alto', 'Chiara', 'Jesús Nazareno', 'Quinua', 'San Juan Bautista', 'Socos'] },
      { nombre: 'Huanta', centro: { lat: -12.9422, lng: -74.2478 }, distritos: ['Huanta', 'Ayahuanco', 'Huamanguilla', 'Iguain', 'Luricocha', 'Santillana', 'Sivia'] },
    ],
  },
  {
    nombre: 'Cajamarca',
    centro: { lat: -7.1638, lng: -78.5003 },
    provincias: [
      { nombre: 'Cajamarca', centro: { lat: -7.1638, lng: -78.5003 }, distritos: ['Cajamarca', 'Asunción', 'Bañon del Inca', 'Chetilla', 'Jesús', 'Los Baños del Inca', 'Magdalena', 'Namora'] },
      { nombre: 'Jaén', centro: { lat: -5.7078, lng: -78.8078 }, distritos: ['Jaén', 'Bellavista', 'Chontalí', 'Colasay', 'Huabal', 'Las Pirias', 'Pucará', 'San Felipe', 'Santa Rosa'] },
    ],
  },
  {
    nombre: 'Callao',
    centro: { lat: -12.0565, lng: -77.1181 },
    provincias: [
      { nombre: 'Callao', centro: { lat: -12.0565, lng: -77.1181 }, distritos: ['Callao', 'Bellavista', 'Carmen de la Legua Reynoso', 'La Perla', 'La Punta', 'Mi Perú', 'Ventanilla'] },
    ],
  },
  {
    nombre: 'Cusco',
    centro: { lat: -13.5319, lng: -71.9675 },
    provincias: [
      { nombre: 'Cusco', centro: { lat: -13.5319, lng: -71.9675 }, distritos: ['Cusco', 'Ccorca', 'Poroy', 'San Jerónimo', 'San Sebastián', 'Santiago', 'Saylla', 'Wanchaq'] },
      { nombre: 'Urubamba', centro: { lat: -13.3047, lng: -72.1158 }, distritos: ['Urubamba', 'Chinchero', 'Huayllabamba', 'Machupicchu', 'Maras', 'Ollantaytambo', 'Yucay'] },
      { nombre: 'La Convención', centro: { lat: -12.8689, lng: -72.6989 }, distritos: ['Santa Ana', 'Echarati', 'Huellopata', 'Maranura', 'Ocobamba', 'Pichari', 'Quellouno', 'Vilcabamba'] },
    ],
  },
  {
    nombre: 'Huancavelica',
    centro: { lat: -12.7864, lng: -74.9756 },
    provincias: [
      { nombre: 'Huancavelica', centro: { lat: -12.7864, lng: -74.9756 }, distritos: ['Huancavelica', 'Acobambilla', 'Acoria', 'Ascensión', 'Conayca', 'Izcuchaca', 'Palca', 'Yauli'] },
      { nombre: 'Tayacaja', centro: { lat: -12.3989, lng: -74.8689 }, distritos: ['Pampas', 'Acostambo', 'Ahuaycha', 'Colcabamba', 'Daniel Hernández', 'Surcubamba'] },
    ],
  },
  {
    nombre: 'Huánuco',
    centro: { lat: -9.9306, lng: -76.2422 },
    provincias: [
      { nombre: 'Huánuco', centro: { lat: -9.9306, lng: -76.2422 }, distritos: ['Huánuco', 'Amarilis', 'Chinchao', 'Churubamba', 'Margos', 'Pillco Marca', 'Santa María del Valle'] },
      { nombre: 'Leoncio Prado', centro: { lat: -9.2989, lng: -75.9989 }, distritos: ['Rupa-Rupa', 'Castillo Grande', 'Daniel Alomía Robles', 'Hermilio Valdizán', 'José Crespo y Castillo', 'Luyando', 'Mariano Dámaso Beraun'] },
    ],
  },
  {
    nombre: 'Ica',
    centro: { lat: -14.0678, lng: -75.7286 },
    provincias: [
      { nombre: 'Ica', centro: { lat: -14.0678, lng: -75.7286 }, distritos: ['Ica', 'La Tinguiña', 'Los Aquijes', 'Ocucaje', 'Pachacútec', 'Parcona', 'Pueblo Nuevo', 'Salas', 'San José de Los Molinos', 'San Juan Bautista', 'Santiago', 'Subtanjalla', 'Tate', 'Yauca del Rosario'] },
      { nombre: 'Chincha', centro: { lat: -13.4178, lng: -76.1322 }, distritos: ['Chincha Alta', 'Alto Larán', 'Chavín', 'Chincha Baja', 'El Carmen', 'Grocio Prado', 'Pueblo Nuevo', 'Sunampe', 'Tambo de Mora'] },
      { nombre: 'Pisco', centro: { lat: -13.7089, lng: -76.2053 }, distritos: ['Pisco', 'Huancano', 'Humay', 'Independencia', 'Paracas', 'San Andrés', 'San Clemente', 'Túpac Amaru Inca'] },
      { nombre: 'Nazca', centro: { lat: -14.829, lng: -74.9386 }, distritos: ['Nazca', 'Changuillo', 'El Ingenio', 'Marcona', 'Vista Alegre'] },
      { nombre: 'Palpa', centro: { lat: -14.5336, lng: -75.1856 }, distritos: ['Palpa', 'Llipata', 'Río Grande', 'Santa Cruz', 'Tibillo'] },
    ],
  },
  {
    nombre: 'Junín',
    centro: { lat: -12.0651, lng: -75.2049 },
    provincias: [
      { nombre: 'Huancayo', centro: { lat: -12.0651, lng: -75.2049 }, distritos: ['Huancayo', 'Chilca', 'El Tambo', 'Huancán', 'Pilcomayo', 'San Agustín', 'San Jerónimo de Tunán', 'Sapallanga', 'Sicaya', 'Viques'] },
      { nombre: 'Chanchamayo', centro: { lat: -11.0549, lng: -75.3304 }, distritos: ['Chanchamayo', 'Perené', 'Pichanaqui', 'San Luis de Shuaro', 'San Ramón', 'Vitoc'] },
      { nombre: 'Tarma', centro: { lat: -11.4189, lng: -75.6889 }, distritos: ['Tarma', 'Acobamba', 'Huaricolca', 'Huasahuasi', 'La Unión', 'Palca', 'Palcamayo', 'San Pedro de Cajas', 'Tapo'] },
      { nombre: 'Satipo', centro: { lat: -11.2522, lng: -74.6389 }, distritos: ['Satipo', 'Coviriali', 'Llaylla', 'Mazamari', 'Pampa Hermosa', 'Pangoa', 'Río Negro', 'Río Tambo'] },
    ],
  },
  {
    nombre: 'La Libertad',
    centro: { lat: -8.1117, lng: -79.0287 },
    provincias: [
      { nombre: 'Trujillo', centro: { lat: -8.1117, lng: -79.0287 }, distritos: ['Trujillo', 'El Porvenir', 'Florencia de Mora', 'Huanchaco', 'La Esperanza', 'Laredo', 'Moche', 'Salaverry', 'Víctor Larco Herrera'] },
      { nombre: 'Virú', centro: { lat: -8.4144, lng: -78.7525 }, distritos: ['Virú', 'Chao', 'Guadalupito'] },
      { nombre: 'Ascope', centro: { lat: -7.7144, lng: -79.1089 }, distritos: ['Ascope', 'Casa Grande', 'Chicama', 'Chocope', 'Magdalena de Cao', 'Paiján', 'Rázuri', 'Santiago de Cao'] },
      { nombre: 'Chepén', centro: { lat: -7.2289, lng: -79.4319 }, distritos: ['Chepén', 'Pacanga', 'Pueblo Nuevo'] },
      { nombre: 'Pacasmayo', centro: { lat: -7.4019, lng: -79.5719 }, distritos: ['San Pedro de Lloc', 'Guadalupe', 'Jequetepeque', 'Pacasmayo', 'San José'] },
    ],
  },
  {
    nombre: 'Lambayeque',
    centro: { lat: -6.7714, lng: -79.8409 },
    provincias: [
      { nombre: 'Chiclayo', centro: { lat: -6.7714, lng: -79.8409 }, distritos: ['Chiclayo', 'José Leonardo Ortiz', 'La Victoria', 'Cayaltí', 'Chongoyape', 'Eten', 'Monsefú', 'Pimentel', 'Pomalca', 'Reque', 'Saña'] },
      { nombre: 'Lambayeque', centro: { lat: -6.7011, lng: -79.9042 }, distritos: ['Lambayeque', 'Chochope', 'Illimo', 'Jayanca', 'Mochumí', 'Mórrope', 'Motupe', 'Olmos', 'Pacora', 'Salas', 'San José', 'Túcume'] },
      { nombre: 'Ferreñafe', centro: { lat: -6.6389, lng: -79.7889 }, distritos: ['Ferreñafe', 'Cañaris', 'Incahuasi', 'Manuel Antonio Mesones Muro', 'Pítipo', 'Pueblo Nuevo'] },
    ],
  },
  {
    nombre: 'Lima',
    centro: { lat: -12.0464, lng: -77.0428 },
    provincias: [
      {
        nombre: 'Lima',
        centro: { lat: -12.0464, lng: -77.0428 },
        distritos: [
          'El Agustino', 'Cercado de Lima', 'Ate', 'Barranco', 'Breña', 'Carabayllo', 'Chaclacayo', 'Chorrillos', 'Cieneguilla', 'Comas', 'Independencia', 'Jesús María', 'La Molina', 'La Victoria', 'Lince', 'Los Olivos', 'Lurigancho-Chosica', 'Lurín', 'Magdalena del Mar', 'Miraflores', 'Pachacámac', 'Pucusana', 'Pueblo Libre', 'Puente Piedra', 'Punta Hermosa', 'Punta Negra', 'Rímac', 'San Bartolo', 'San Borja', 'San Isidro', 'San Juan de Lurigancho', 'San Juan de Miraflores', 'San Luis', 'San Martín de Porres', 'San Miguel', 'Santa Anita', 'Santa María del Mar', 'Santa Rosa', 'Santiago de Surco', 'Surquillo', 'Villa El Salvador', 'Villa María del Triunfo',
        ],
      },
      {
        nombre: 'Cañete',
        centro: { lat: -13.0768, lng: -76.3854 },
        distritos: ['San Vicente de Cañete', 'Imperial', 'Lunahuaná', 'Nuevo Imperial', 'Quilmaná', 'San Luis', 'Cerro Azul', 'Mala', 'Asia', 'Calango', 'Chilca', 'Santa Cruz de Flores', 'Coayllo', 'Pacarán', 'Zúñiga', 'San Antonio'],
      },
      { nombre: 'Huaral', centro: { lat: -11.4947, lng: -77.2081 }, distritos: ['Huaral', 'Chancay', 'Aucallama', 'Ihuarí', 'Lampían', 'Pacaraos', 'Santa Cruz de Andamarca', 'Sumbilca', 'Veintisiete de Noviembre'] },
      { nombre: 'Barranca', centro: { lat: -10.7522, lng: -77.7611 }, distritos: ['Barranca', 'Paramonga', 'Pativilca', 'Supe', 'Supe Puerto'] },
      { nombre: 'Huaura', centro: { lat: -11.1067, lng: -77.605 }, distritos: ['Huacho', 'Hualmay', 'Huaura', 'Santa María', 'Sayán', 'Végueta', 'Ambar', 'Carquín', 'Checras', 'Leoncio Prado', 'Paccho', 'Santa Leonor'] },
      { nombre: 'Huarochirí', centro: { lat: -11.8489, lng: -76.3789 }, distritos: ['Matucana', 'Antioquía', 'Callahuanca', 'Carampoma', 'Chicla', 'Cuenca', 'Laraos', 'Mariatana', 'Ricardo Palma', 'San Bartolomé', 'San Mateo', 'Santa Eulalia', 'Surco'] },
    ],
  },
  {
    nombre: 'Loreto',
    centro: { lat: -3.7491, lng: -73.2538 },
    provincias: [
      { nombre: 'Maynas', centro: { lat: -3.7491, lng: -73.2538 }, distritos: ['Iquitos', 'Alto Nanay', 'Fernando Lores', 'Indiana', 'Las Amazonas', 'Mazan', 'Punchana', 'San Juan Bautista', 'Belén'] },
      { nombre: 'Alto Amazonas', centro: { lat: -5.8989, lng: -76.1089 }, distritos: ['Yurimaguas', 'Balsapuerto', 'Jeberos', 'Lagunas', 'Santa Cruz', 'Teniente César López Rojas'] },
    ],
  },
  {
    nombre: 'Madre de Dios',
    centro: { lat: -12.5933, lng: -69.1891 },
    provincias: [
      { nombre: 'Tambopata', centro: { lat: -12.5933, lng: -69.1891 }, distritos: ['Puerto Maldonado', 'Inambari', 'Las Piedras', 'Laberinto'] },
      { nombre: 'Manu', centro: { lat: -12.2589, lng: -70.9089 }, distritos: ['Manu', 'Fitzcarrald', 'Madre de Dios', 'Huepetuhe'] },
      { nombre: 'Tahuamanu', centro: { lat: -11.4289, lng: -69.4889 }, distritos: ['Iñapari', 'Iberia', 'Tahuamanu'] },
    ],
  },
  {
    nombre: 'Moquegua',
    centro: { lat: -17.1983, lng: -70.9356 },
    provincias: [
      { nombre: 'Mariscal Nieto', centro: { lat: -17.1983, lng: -70.9356 }, distritos: ['Moquegua', 'Carumas', 'Cuchumbaya', 'Samegua', 'San Cristóbal', 'Torata'] },
      { nombre: 'Ilo', centro: { lat: -17.6394, lng: -71.3375 }, distritos: ['Ilo', 'El Algarrobal', 'Pacocha'] },
      { nombre: 'General Sánchez Cerro', centro: { lat: -16.7189, lng: -71.0289 }, distritos: ['Omate', 'Chojata', 'Coalaque', 'Ichuña', 'La Capilla', 'Lloque', 'Matalaque', 'Puquina', 'Quinistaquillas', 'Ubinas', 'Yunga'] },
    ],
  },
  {
    nombre: 'Pasco',
    centro: { lat: -10.6675, lng: -76.2564 },
    provincias: [
      { nombre: 'Pasco', centro: { lat: -10.6675, lng: -76.2564 }, distritos: ['Chaupimarca', 'Huachón', 'Huariaca', 'Huayllay', 'Ninacaca', 'Pallanchacra', 'Paucartambo', 'San Francisco de Asís de Yarusyacán', 'Simon Bolívar', 'Ticlacayán', 'Tinyahuarco', 'Vicco', 'Yanacancha'] },
      { nombre: 'Oxapampa', centro: { lat: -10.5775, lng: -75.4017 }, distritos: ['Oxapampa', 'Chontabamba', 'Huancabamba', 'Palcazú', 'Pozuzo', 'Puerto Bermúdez', 'Villa Rica'] },
    ],
  },
  {
    nombre: 'Piura',
    centro: { lat: -5.1945, lng: -80.6328 },
    provincias: [
      { nombre: 'Piura', centro: { lat: -5.1945, lng: -80.6328 }, distritos: ['Piura', 'Castilla', 'Catacaos', 'Cura Mori', 'El Tallán', 'La Arena', 'La Unión', 'Las Lomas', 'Tambo Grande', 'Veintiséis de Octubre'] },
      { nombre: 'Sullana', centro: { lat: -4.9039, lng: -80.6853 }, distritos: ['Sullana', 'Bellavista', 'Ignacio Escudero', 'Lancones', 'Marcavelica', 'Miguel Checa', 'Querecotillo', 'Salitral'] },
      { nombre: 'Talara', centro: { lat: -4.5772, lng: -81.2719 }, distritos: ['Pariñas', 'El Alto', 'La Brea', 'Lobitos', 'Los Órganos', 'Máncora'] },
      { nombre: 'Paita', centro: { lat: -5.0892, lng: -81.1078 }, distritos: ['Paita', 'Amotape', 'Arenal', 'Colán', 'La Huaca', 'Tamarindo', 'Vichayal'] },
      { nombre: 'Morropón', centro: { lat: -5.1819, lng: -80.1689 }, distritos: ['Chulucanas', 'Buenos Aires', 'Chalaco', 'La Matanza', 'Morropón', 'Salitral', 'San Juan de Bigote', 'Santa Catalina de Mossa', 'Santo Domingo', 'Yamango'] },
    ],
  },
  {
    nombre: 'Puno',
    centro: { lat: -15.8422, lng: -70.0199 },
    provincias: [
      { nombre: 'Puno', centro: { lat: -15.8422, lng: -70.0199 }, distritos: ['Puno', 'Acora', 'Amantaní', 'Atuncolla', 'Capachica', 'Chucuito', 'Coata', 'Huata', 'Mañazo', 'Paucarcolla', 'Pichacani', 'Platería', 'San Antonio', 'Tiquillaca', 'Vilque'] },
      { nombre: 'San Román', centro: { lat: -15.4989, lng: -70.1389 }, distritos: ['Juliaca', 'Cabana', 'Cabanillas', 'Caracoto'] },
    ],
  },
  {
    nombre: 'San Martín',
    centro: { lat: -6.4869, lng: -76.3686 },
    provincias: [
      { nombre: 'San Martín', centro: { lat: -6.4869, lng: -76.3686 }, distritos: ['Tarapoto', 'Alberto Leveau', 'Cacatachi', 'Chazuta', 'Chipurana', 'El Porvenir', 'Huimbayoc', 'Juan Guerra', 'La Banda de Shilcayo', 'Morales', 'Papaplaya', 'San Antonio', 'Sauce', 'Shapaja'] },
      { nombre: 'Moyobamba', centro: { lat: -6.0342, lng: -76.9714 }, distritos: ['Moyobamba', 'Calzada', 'Habana', 'Jepelacio', 'Soritor', 'Yantaló'] },
      { nombre: 'Rioja', centro: { lat: -6.0589, lng: -77.1689 }, distritos: ['Rioja', 'Awajún', 'Elias Soplín Vargas', 'Nueva Cajamarca', 'Pardo Miguel', 'Posic', 'San Fernando', 'Yorongos', 'Yuracyacu'] },
      { nombre: 'Tocache', centro: { lat: -8.1889, lng: -76.5189 }, distritos: ['Tocache', 'Nuevo Progreso', 'Pólvora', 'Shunté', 'Uchiza'] },
    ],
  },
  {
    nombre: 'Tacna',
    centro: { lat: -18.0066, lng: -70.2463 },
    provincias: [
      { nombre: 'Tacna', centro: { lat: -18.0066, lng: -70.2463 }, distritos: ['Tacna', 'Alto de la Alianza', 'Calana', 'Ciudad Nueva', 'Coronel Gregorio Albarracín Lanchipa', 'Inclán', 'Pachía', 'Palca', 'Pocollay', 'Sama'] },
      { nombre: 'Jorge Basadre', centro: { lat: -17.7589, lng: -70.7389 }, distritos: ['Locumba', 'Ilabaya', 'Ite'] },
    ],
  },
  {
    nombre: 'Tumbes',
    centro: { lat: -3.5669, lng: -80.4515 },
    provincias: [
      { nombre: 'Tumbes', centro: { lat: -3.5669, lng: -80.4515 }, distritos: ['Tumbes', 'Corrales', 'La Cruz', 'Pampas de Hospital', 'San Jacinto', 'San Juan de la Virgen'] },
      { nombre: 'Zarumilla', centro: { lat: -3.5019, lng: -80.2719 }, distritos: ['Zarumilla', 'Aguas Verdes', 'Matapalo', 'Papayal'] },
      { nombre: 'Contralmirante Villar', centro: { lat: -3.6819, lng: -80.6589 }, distritos: ['Zorritos', 'Casitas', 'Canoas de Punta Sal'] },
    ],
  },
  {
    nombre: 'Ucayali',
    centro: { lat: -8.3791, lng: -74.5539 },
    provincias: [
      { nombre: 'Coronel Portillo', centro: { lat: -8.3791, lng: -74.5539 }, distritos: ['Callería', 'Campoverde', 'Iparía', 'Manantay', 'Masisea', 'Yarinacocha', 'Nueva Requena'] },
      { nombre: 'Padre Abad', centro: { lat: -9.0389, lng: -75.5089 }, distritos: ['Padre Abad', 'Irazola', 'Curimaná', 'Neshuya', 'Alexander Von Humboldt'] },
    ],
  },
];
