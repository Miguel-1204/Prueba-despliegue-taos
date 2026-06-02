// Importar imágenes reales de Flores de mi Tierra
import doradoBlanco from '../assets/TAOS_img/Flores_de_mi_tierra/Dorado_blanco.png';
import doradoPerlado from '../assets/TAOS_img/Flores_de_mi_tierra/Dorado_perlado.png';
import plataPlateado from '../assets/TAOS_img/Flores_de_mi_tierra/Plata_plateado.png';
import plateadoFucsia from '../assets/TAOS_img/Flores_de_mi_tierra/Plateado_fucsia.png';
import verdeEsmeralda from '../assets/TAOS_img/Flores_de_mi_tierra/Verde_esmeralda.png';

// Importar imágenes reales de Mariposas
import mariposaBlancoRojo from '../assets/TAOS_img/Mariposas/M_Blanco_con_rojo.png';
import mariposaMultiPastel from '../assets/TAOS_img/Mariposas/M_Multi_pastel.png';
import mariposaNegraMulti from '../assets/TAOS_img/Mariposas/M_Negra_multi_color.png';
import mariposaTejidaBlanca from '../assets/TAOS_img/Mariposas/M_Tegida_blanca.png';

export const products = [
  // Flores de mi Tierra
  {
    id: 'flor-dorado-blanco',
    name: 'Flor Dorado Blanco',
    collection: 'Flores de mi Tierra',
    collectionSlug: 'flores-de-mi-tierra',
    price: 135000,
    priceFormatted: '$135.000 COP',
    image: doradoBlanco,
    description: 'Elegantes aretes inspirados en la flora silvestre. Baño de oro de 24k combinado con resinas de alta calidad blanca perlada. Una joya versátil ideal para eventos formales o el uso diario sofisticado.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resina blanca',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 6g por arete',
      'Dimensiones: 3.5 cm de diámetro'
    ]
  },
  {
    id: 'flor-dorado-perlado',
    name: 'Flor Dorado Perlado',
    collection: 'Flores de mi Tierra',
    collectionSlug: 'flores-de-mi-tierra',
    price: 145000,
    priceFormatted: '$145.000 COP',
    image: doradoPerlado,
    description: 'Aretes con un brillo perlado sublime que captura la luz de manera mágica. El contorno dorado realza la delicadeza de los pétalos de textura perlada orgánica. Un diseño exclusivo de la casa TAOS.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y acabado perlado orgánico',
      'Tipo de cierre: Pin antialérgico con mariposa',
      'Peso aproximado: 7g por arete',
      'Dimensiones: 3.8 cm de diámetro'
    ]
  },
  {
    id: 'flor-plata-plateado',
    name: 'Flor Plata Plateado',
    collection: 'Flores de mi Tierra',
    collectionSlug: 'flores-de-mi-tierra',
    price: 125000,
    priceFormatted: '$125.000 COP',
    image: plataPlateado,
    description: 'Un diseño sobrio y moderno con baño de plata de ley de alta pureza. Su textura cepillada a mano aporta un brillo sutil contemporáneo. Perfecto para los amantes de la joyería plateada de diseño minimalista.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de plata de ley 925 y acabado satinado',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 5.5g por arete',
      'Dimensiones: 3.2 cm de diámetro'
    ]
  },
  {
    id: 'flor-plateado-fucsia',
    name: 'Flor Plateado Fucsia',
    collection: 'Flores de mi Tierra',
    collectionSlug: 'flores-de-mi-tierra',
    price: 138000,
    priceFormatted: '$138.000 COP',
    image: plateadoFucsia,
    description: 'El contraste perfecto entre el brillo metálico de la plata y la intensidad vibrante del fucsia. Una pieza llena de energía, ideal para ser el centro de atención de cualquier atuendo festivo o elegante.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de plata de ley y pigmentación fucsia translúcida',
      'Tipo de cierre: Pin antialérgico',
      'Peso aproximado: 6.2g por arete',
      'Dimensiones: 3.6 cm de diámetro'
    ]
  },
  {
    id: 'flor-verde-esmeralda',
    name: 'Flor Verde Esmeralda',
    collection: 'Flores de mi Tierra',
    collectionSlug: 'flores-de-mi-tierra',
    price: 150000,
    priceFormatted: '$150.000 COP',
    image: verdeEsmeralda,
    description: 'Inspirados en la riqueza natural y las esmeraldas colombianas. Esta flor combina la elegancia del baño de oro con un esmalte color verde esmeralda profundo que irradia misticismo y sofisticación.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y esmaltado verde esmeralda premium',
      'Tipo de cierre: Topo / Pin de plata de ley',
      'Peso aproximado: 6.8g por arete',
      'Dimensiones: 3.5 cm de diámetro'
    ]
  },

  // Mariposas
  {
    id: 'mariposa-blanco-rojo',
    name: 'Mariposa Blanco con Rojo',
    collection: 'Mariposas',
    collectionSlug: 'mariposas',
    price: 160000,
    priceFormatted: '$160.000 COP',
    image: mariposaBlancoRojo,
    description: 'Aretes colgantes tipo mariposa que emulan la fragilidad y belleza de las alas de la naturaleza. Los detalles pintados a mano en tonos rojos y blancos crean un patrón dinámico e hipnótico al moverse.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Latón de joyería con baño de oro, micro-tejido y pintura acrílica sellada',
      'Tipo de cierre: Gancho español o anzuelo de plata',
      'Peso aproximado: 4.5g por arete (ultraligeros)',
      'Dimensiones: 4.8 cm de largo'
    ]
  },
  {
    id: 'mariposa-multi-pastel',
    name: 'Mariposa Multi Pastel',
    collection: 'Mariposas',
    collectionSlug: 'mariposas',
    price: 165000,
    priceFormatted: '$165.000 COP',
    image: mariposaMultiPastel,
    description: 'Una sinfonía de tonos pastel que evoca la dulzura de la primavera. Colores degradados en azul cielo, lila y rosa pálido sobre un chasis dorado ultraligero que revoloteará elegantemente con cada movimiento de cabeza.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Estructura de bronce con baño de oro, resina translúcida y pigmentos pastel',
      'Tipo de cierre: Gancho / Pin antialérgico',
      'Peso aproximado: 4.8g por arete',
      'Dimensiones: 4.5 cm de largo'
    ]
  },
  {
    id: 'mariposa-negra-multicolor',
    name: 'Mariposa Negra Multi Color',
    collection: 'Mariposas',
    collectionSlug: 'mariposas',
    price: 170000,
    priceFormatted: '$170.000 COP',
    image: mariposaNegraMulti,
    description: 'Una pieza dramática de alta sofisticación. El fondo negro profundo hace resaltar los destellos multicolor de las alas pintadas a mano. Ideal para la noche, aportando un toque misterioso, sofisticado y exclusivo.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce chapado en oro, esmalte negro brillante y pigmentación iridiscente',
      'Tipo de cierre: Gancho español elegante',
      'Peso aproximado: 5.2g por arete',
      'Dimensiones: 5.0 cm de largo'
    ]
  },
  {
    id: 'mariposa-tejida-blanca',
    name: 'Mariposa Tejida Blanca',
    collection: 'Mariposas',
    collectionSlug: 'mariposas',
    price: 158000,
    priceFormatted: '$158.000 COP',
    image: mariposaTejidaBlanca,
    description: 'Una obra de arte textil y joyería. Esta mariposa combina filigrana y micro-tejido manual en hilos blancos sobre un armazón de baño de oro. Ofrece una textura orgánica única y una ligereza inigualable.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Filigrana de bronce chapado en oro e hilos de seda blanca micro-tejidos',
      'Tipo de cierre: Pin antialérgico',
      'Peso aproximado: 4.0g por arete (extra liviano)',
      'Dimensiones: 4.2 cm de largo'
    ]
  }
];

export const collections = [
  {
    slug: 'flores-de-mi-tierra',
    name: 'Flores de mi Tierra',
    description: 'Inspirada en la biodiversidad floral y la exuberancia de los paisajes colombianos. Formas circulares, texturas orgánicas y resinas de brillo perlado.',
    featuredImage: doradoBlanco
  },
  {
    slug: 'mariposas',
    name: 'Mariposas',
    description: 'El vuelo libre y la ligereza representados en filigrana, micro-tejidos y esmaltes multicolores. Piezas ultraligeras llenas de movimiento.',
    featuredImage: mariposaMultiPastel
  }
];
