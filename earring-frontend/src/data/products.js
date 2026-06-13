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

// Importar imágenes reales de Maxi Flor
import maxiFlorRojo from '../assets/TAOS_img/Maxi_flor/Maxi_flor-rojo.png';
import maxiFlorBoreal from '../assets/TAOS_img/Maxi_flor/Maxi_flor_boreal.png';
import maxiFlorMultiColor from '../assets/TAOS_img/Maxi_flor/Maxi_flor_multi_color.png';
import maxiFlorNegro from '../assets/TAOS_img/Maxi_flor/Maxi_flor_negro.png';
import maxiFlorPlateada from '../assets/TAOS_img/Maxi_flor/Maxi_flor_plateada.png';
import maxiFlorTonosTierra from '../assets/TAOS_img/Maxi_flor/Maxi_flor_tonos_tierra.png';

// Importar imágenes reales de Media Flor
import mediaFlorMultiColor from '../assets/TAOS_img/Media_flor/Media_flor_multi_color.png';
import mediaFlorOpalo from '../assets/TAOS_img/Media_flor/Media_flor_opalo.png';
import mediaFlorRojo from '../assets/TAOS_img/Media_flor/Media_flor_rojo.png';
import mediaFlorTonosTierra from '../assets/TAOS_img/Media_flor/Media_flor_tonos_tierra.png';

// Importar imágenes reales de Orquídeas
import orquideaAmarilla from '../assets/TAOS_img/Orquideas/Orquidea_amarilla.png';
import orquideaLilaFucsia from '../assets/TAOS_img/Orquideas/Orquidea_lila_con_fucsia.png';
import orquideaPaloDeRosa from '../assets/TAOS_img/Orquideas/Orquidea_palo_de_rosa.png';

// Importar modelos GLB desde src/assets (usar copia en assets en lugar de public)
import doradoBlancoGLB from '../assets/TAOS_img3D/Flores_de_mi_tierra/Dorado_blanco.glb?url';
import doradoPerladoGLB from '../assets/TAOS_img3D/Flores_de_mi_tierra/Dorado_perlado.glb?url';
import plataPlateadaGLB from '../assets/TAOS_img3D/Flores_de_mi_tierra/Plata_plateada.glb?url';
import plateadoFucsiaGLB from '../assets/TAOS_img3D/Flores_de_mi_tierra/Plateado_fucsia.glb?url';
import verdeEsmeraldaGLB from '../assets/TAOS_img3D/Flores_de_mi_tierra/Verde_esmeralda.glb?url';

import mariposaBlancoRojoGLB from '../assets/TAOS_img3D/Mariposas/M_Blanco_con_rojo.glb?url';
import mariposaMultiPastelGLB from '../assets/TAOS_img3D/Mariposas/M_Multi_pastel.glb?url';
import mariposaNegraMultiGLB from '../assets/TAOS_img3D/Mariposas/M_Negra_multi_color.glb?url';
import mariposaTejidaBlancaGLB from '../assets/TAOS_img3D/Mariposas/M_Tegida_blanca.glb?url';

import maxiFlorRojoGLB from '../assets/TAOS_img3D/Maxi_flor/Maxi_flor_rojo.glb?url';
import maxiFlorBorealGLB from '../assets/TAOS_img3D/Maxi_flor/Maxi_flor_boreal.glb?url';
import maxiFlorMultiColorGLB from '../assets/TAOS_img3D/Maxi_flor/Maxi_flor_multi_color.glb?url';
import maxiFlorNegroGLB from '../assets/TAOS_img3D/Maxi_flor/Maxi_flor_negro.glb?url';
import maxiFlorPlateadaGLB from '../assets/TAOS_img3D/Maxi_flor/Maxi_flor_plateada.glb?url';
import maxiFlorTonosTierraGLB from '../assets/TAOS_img3D/Maxi_flor/Maxi_flor_tonos_tierra.glb?url';

export const products = [
  // ── Flores de mi Tierra ──────────────────────────────────────────────────
  {
    id: 'flor-dorado-blanco',
    name: 'Flor Dorado Blanco',
    collection: 'Flores de mi Tierra',
    collectionSlug: 'flores-de-mi-tierra',
    price: 135000,
    priceFormatted: '$135.000 COP',
    image: doradoBlanco,
    glbPath: doradoBlancoGLB,
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
    glbPath: doradoPerladoGLB,
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
    glbPath: plataPlateadaGLB,
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
    glbPath: plateadoFucsiaGLB,
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
    glbPath: verdeEsmeraldaGLB,
    description: 'Inspirados en la riqueza natural y las esmeraldas colombianas. Esta flor combina la elegancia del baño de oro con un esmalte color verde esmeralda profundo que irradia misticismo y sofisticación.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y esmaltado verde esmeralda premium',
      'Tipo de cierre: Topo / Pin de plata de ley',
      'Peso aproximado: 6.8g por arete',
      'Dimensiones: 3.5 cm de diámetro'
    ]
  },

  // ── Mariposas ─────────────────────────────────────────────────────────────
  {
    id: 'mariposa-blanco-rojo',
    name: 'Mariposa Blanco con Rojo',
    collection: 'Mariposas',
    collectionSlug: 'mariposas',
    price: 160000,
    priceFormatted: '$160.000 COP',
    image: mariposaBlancoRojo,
    glbPath: mariposaBlancoRojoGLB,
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
    glbPath: mariposaMultiPastelGLB,
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
    glbPath: mariposaNegraMultiGLB,
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
    glbPath: mariposaTejidaBlancaGLB,
    description: 'Una obra de arte textil y joyería. Esta mariposa combina filigrana y micro-tejido manual en hilos blancos sobre un armazón de baño de oro. Ofrece una textura orgánica única y una ligereza inigualable.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Filigrana de bronce chapado en oro e hilos de seda blanca micro-tejidos',
      'Tipo de cierre: Pin antialérgico',
      'Peso aproximado: 4.0g por arete (extra liviano)',
      'Dimensiones: 4.2 cm de largo'
    ]
  },

  // ── Maxi Flor ─────────────────────────────────────────────────────────────
  {
    id: 'maxi-flor-rojo',
    name: 'Maxi Flor Rojo',
    collection: 'Maxi Flor',
    collectionSlug: 'maxi-flor',
    price: 155000,
    priceFormatted: '$155.000 COP',
    image: maxiFlorRojo,
    glbPath: maxiFlorRojoGLB,
    description: 'Una explosión de color y elegancia. El rojo intenso de esta maxi flor artesanal la convierte en la pieza protagonista de cualquier conjunto. Perfecta para quienes buscan un accesorio que haga una declaración audaz.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resina pigmentada en rojo vibrante',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 7g por arete',
      'Dimensiones: 5.0 cm de diámetro'
    ]
  },
  {
    id: 'maxi-flor-boreal',
    name: 'Maxi Flor Boreal',
    collection: 'Maxi Flor',
    collectionSlug: 'maxi-flor',
    price: 168000,
    priceFormatted: '$168.000 COP',
    image: maxiFlorBoreal,
    glbPath: maxiFlorBorealGLB,
    description: 'Inspirada en las auroras boreales, esta maxi flor captura el misterio y la belleza de los cielos nocturnos del norte. Sus tonos iridiscentes azules, verdes y púrpura la hacen verdaderamente única.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro y resinas iridiscentes multicapa',
      'Tipo de cierre: Pin antialérgico con mariposa',
      'Peso aproximado: 8g por arete',
      'Dimensiones: 5.2 cm de diámetro'
    ]
  },
  {
    id: 'maxi-flor-multi-color',
    name: 'Maxi Flor Multi Color',
    collection: 'Maxi Flor',
    collectionSlug: 'maxi-flor',
    price: 162000,
    priceFormatted: '$162.000 COP',
    image: maxiFlorMultiColor,
    glbPath: maxiFlorMultiColorGLB,
    description: 'Una celebración de colores que evocan la alegría y la diversidad de la flora tropical colombiana. Cada pétalo luce un tono diferente, creando un efecto visual impactante y festivo.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resinas multicolor de alta calidad',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 7.5g por arete',
      'Dimensiones: 5.0 cm de diámetro'
    ]
  },
  {
    id: 'maxi-flor-negro',
    name: 'Maxi Flor Negro',
    collection: 'Maxi Flor',
    collectionSlug: 'maxi-flor',
    price: 158000,
    priceFormatted: '$158.000 COP',
    image: maxiFlorNegro,
    glbPath: maxiFlorNegroGLB,
    description: 'La sofisticación en su máxima expresión. El negro profundo de esta maxi flor aporta un contraste dramático sobre cualquier atuendo, convirtiéndola en un accesorio de lujo atemporal para la mujer moderna.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y esmalte negro brillante',
      'Tipo de cierre: Pin antialérgico',
      'Peso aproximado: 7g por arete',
      'Dimensiones: 5.0 cm de diámetro'
    ]
  },
  {
    id: 'maxi-flor-plateada',
    name: 'Maxi Flor Plateada',
    collection: 'Maxi Flor',
    collectionSlug: 'maxi-flor',
    price: 150000,
    priceFormatted: '$150.000 COP',
    image: maxiFlorPlateada,
    glbPath: maxiFlorPlateadaGLB,
    description: 'Elegancia clásica con un acabado plateado impecable. Esta maxi flor es la elección perfecta para quienes buscan un arete grande pero discreto, con el brillo refinado de la plata de ley.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de plata de ley 925 y acabado pulido a espejo',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 6.8g por arete',
      'Dimensiones: 5.0 cm de diámetro'
    ]
  },
  {
    id: 'maxi-flor-tonos-tierra',
    name: 'Maxi Flor Tonos Tierra',
    collection: 'Maxi Flor',
    collectionSlug: 'maxi-flor',
    price: 155000,
    priceFormatted: '$155.000 COP',
    image: maxiFlorTonosTierra,
    glbPath: maxiFlorTonosTierraGLB,
    description: 'Una oda a la naturaleza en sus colores más cálidos. Los tonos ocre, café, siena y terracota de esta maxi flor crean una armonía terrosa que complementa a la perfección los atuendos en colores neutros y naturales.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resinas en pigmentos tierra',
      'Tipo de cierre: Pin antialérgico',
      'Peso aproximado: 7.2g por arete',
      'Dimensiones: 5.0 cm de diámetro'
    ]
  },

  // ── Media Flor ────────────────────────────────────────────────────────────
  {
    id: 'media-flor-multi-color',
    name: 'Media Flor Multi Color',
    collection: 'Media Flor',
    collectionSlug: 'media-flor',
    price: 128000,
    priceFormatted: '$128.000 COP',
    image: mediaFlorMultiColor,
    description: 'La colección Media Flor ofrece un tamaño intermedio perfecto para el uso cotidiano sin renunciar a la elegancia. Esta versión multicolor es vibrante y versátil, combinando con una gran variedad de estilos.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resinas multicolor',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 5g por arete',
      'Dimensiones: 3.8 cm de diámetro'
    ]
  },
  {
    id: 'media-flor-opalo',
    name: 'Media Flor Ópalo',
    collection: 'Media Flor',
    collectionSlug: 'media-flor',
    price: 138000,
    priceFormatted: '$138.000 COP',
    image: mediaFlorOpalo,
    description: 'Delicadeza y misticismo en un solo arete. El acabado ópalo iridiscente de esta media flor cambia de tonalidad con la luz, revelando destellos de azul, rosa, verde y dorado que evocan las piedras preciosas más codiciadas.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resina efecto ópalo iridiscente',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 4.8g por arete',
      'Dimensiones: 3.8 cm de diámetro'
    ]
  },
  {
    id: 'media-flor-rojo',
    name: 'Media Flor Rojo',
    collection: 'Media Flor',
    collectionSlug: 'media-flor',
    price: 125000,
    priceFormatted: '$125.000 COP',
    image: mediaFlorRojo,
    description: 'Pasión y elegancia en tamaño ideal. La media flor en rojo intenso es el complemento perfecto para quienes buscan un accesorio llamativo pero de tamaño moderado, ideal para el día a día o eventos especiales.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resina roja de alta pigmentación',
      'Tipo de cierre: Pin antialérgico',
      'Peso aproximado: 5g por arete',
      'Dimensiones: 3.8 cm de diámetro'
    ]
  },
  {
    id: 'media-flor-tonos-tierra',
    name: 'Media Flor Tonos Tierra',
    collection: 'Media Flor',
    collectionSlug: 'media-flor',
    price: 128000,
    priceFormatted: '$128.000 COP',
    image: mediaFlorTonosTierra,
    description: 'Suavidad y naturalidad en tamaño perfecto. Los tonos tierra cálidos de esta media flor la convierten en el arete más versátil de la colección, combinando con outfits casuales, de oficina o de evento.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resinas en tonos tierra naturales',
      'Tipo de cierre: Topo / Pin antialérgico',
      'Peso aproximado: 5.2g por arete',
      'Dimensiones: 3.8 cm de diámetro'
    ]
  },

  // ── Orquídeas ─────────────────────────────────────────────────────────────
  {
    id: 'orquidea-amarilla',
    name: 'Orquídea Amarilla',
    collection: 'Orquídeas',
    collectionSlug: 'orquideas',
    price: 175000,
    priceFormatted: '$175.000 COP',
    image: orquideaAmarilla,
    description: 'La orquídea es el símbolo nacional de Colombia, y estos aretes rinden homenaje a su esplendor. El amarillo radiante evoca el sol tropical y la exuberancia de los jardines colombianos, capturado en una joya artesanal de lujo.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resina amarilla translúcida',
      'Tipo de cierre: Pin antialérgico con mariposa',
      'Peso aproximado: 6g por arete',
      'Dimensiones: 4.5 cm de largo'
    ]
  },
  {
    id: 'orquidea-lila-fucsia',
    name: 'Orquídea Lila con Fucsia',
    collection: 'Orquídeas',
    collectionSlug: 'orquideas',
    price: 180000,
    priceFormatted: '$180.000 COP',
    image: orquideaLilaFucsia,
    description: 'Un himno a la Cattleya trianae, la flor de Colombia. Los tonos lila y fucsia de esta orquídea artesanal capturan la majestuosidad de nuestra flor nacional, creando una pieza de colección que toda mujer colombiana debe atesorar.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k, resina lila y acentos fucsia pigmentados',
      'Tipo de cierre: Pin antialérgico premium',
      'Peso aproximado: 6.5g por arete',
      'Dimensiones: 4.8 cm de largo'
    ]
  },
  {
    id: 'orquidea-palo-de-rosa',
    name: 'Orquídea Palo de Rosa',
    collection: 'Orquídeas',
    collectionSlug: 'orquideas',
    price: 175000,
    priceFormatted: '$175.000 COP',
    image: orquideaPaloDeRosa,
    description: 'Delicadeza en estado puro. El tono palo de rosa de esta orquídea artesanal transmite feminidad y sofisticación. Ideal para regalar o para lucir en ocasiones especiales donde se quiere un accesorio de lujo discreto.',
    details: [
      'Hecho a mano en Colombia',
      'Material: Bronce con baño de oro de 24k y resina en tono palo de rosa perlado',
      'Tipo de cierre: Pin antialérgico con mariposa',
      'Peso aproximado: 6g por arete',
      'Dimensiones: 4.5 cm de largo'
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
  },
  {
    slug: 'maxi-flor',
    name: 'Maxi Flor',
    description: 'Grandes y deslumbrantes. La colección Maxi Flor es para la mujer que no teme brillar. Aretes de gran formato con acabados impecables en múltiples colores.',
    featuredImage: maxiFlorBoreal
  },
  {
    slug: 'media-flor',
    name: 'Media Flor',
    description: 'El tamaño perfecto para cada día. La Media Flor equilibra el impacto visual con la comodidad, siendo la opción ideal para el uso diario con estilo.',
    featuredImage: mediaFlorOpalo
  },
  {
    slug: 'orquideas',
    name: 'Orquídeas',
    description: 'Un homenaje a la flor nacional de Colombia. La colección Orquídeas captura la gracia y el colorido de la Cattleya trianae en piezas artesanales de alta joyería.',
    featuredImage: orquideaLilaFucsia
  }
];
