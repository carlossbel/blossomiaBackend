// backend/scripts/seedDatabase.js
const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Inicializar Firebase Admin si aún no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://blossomia-a1db4.firebaseio.com"
  });
}

const db = admin.firestore();

// Datos de categorías
const categorias = [
  { 
    id: 'interior', 
    nombre: 'Plantas de Interior', 
    descripcion: 'Perfectas para decorar tu hogar',
    imagen: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
  },
  { 
    id: 'exterior', 
    nombre: 'Plantas de Exterior', 
    descripcion: 'Resistentes y decorativas',
    imagen: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
  },
  { 
    id: 'cactus', 
    nombre: 'Cactus y Suculentas', 
    descripcion: 'Ideales para principiantes',
    imagen: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
  },
  { 
    id: 'aromaticas', 
    nombre: 'Plantas Aromáticas', 
    descripcion: 'Hierbas para tu cocina',
    imagen: 'https://images.unsplash.com/photo-1515586000433-45406d8e6662?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
  },
  { 
    id: 'acuaticas', 
    nombre: 'Plantas Acuáticas', 
    descripcion: 'Para estanques y fuentes',
    imagen: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
  }
];

// Datos de plantas
const plantas = [
  {
    nombre: 'Monstera Deliciosa',
    categoriaId: 'interior',
    nombreCientifico: 'Monstera deliciosa',
    descripcion: 'La Monstera Deliciosa, también conocida como Costilla de Adán, es una planta trepadora originaria de las selvas tropicales de México y América Central. Es famosa por sus hojas grandes, brillantes y perforadas que le dan un aspecto exótico y tropical.',
    imagen: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1637967886160-fd78dc3ce3f5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1632315557788-919908bfd83f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    ],
    precio: 25.99,
    cuidados: {
      luz: 'Luz indirecta brillante. Evita la luz solar directa que puede quemar sus hojas.',
      riego: 'Riego moderado, aproximadamente cada 7-10 días. Deja que la capa superior del sustrato se seque entre riegos.',
      sustrato: 'Mezcla rica en materia orgánica con buen drenaje.',
      temperatura: 'Entre 18°C y 30°C. No tolera temperaturas bajo los 10°C.',
      humedad: 'Alta humedad ambiental. Beneficiada por pulverización regular o cercanía a un humidificador.',
      fertilizacion: 'Fertilizante equilibrado cada 4-6 semanas durante la temporada de crecimiento (primavera y verano).',
      problemas: 'Susceptible a ácaros y cochinillas. Las hojas amarillentas pueden indicar exceso de agua o falta de nutrientes.'
    },
    detalles: {
      tipoLuz: 'Indirecta brillante',
      frecuenciaRiego: 'Cada 7-10 días',
      dificultad: 'Baja',
      tamanoMax: '2-3 metros de altura',
      origen: 'México y América Central',
      toxicidad: 'Tóxica para mascotas'
    },
    consejos: [
      'Coloca un tutor o soporte para que pueda trepar a medida que crece.',
      'Rota la planta ocasionalmente para que crezca de manera uniforme.',
      'Limpia las hojas con un paño húmedo regularmente para eliminar el polvo.',
      'Las perforaciones características aparecen a medida que la planta madura.'
    ]
  },
  {
    nombre: 'Pothos',
    categoriaId: 'interior',
    nombreCientifico: 'Epipremnum aureum',
    descripcion: 'El Pothos es una planta de enredadera de crecimiento rápido conocida por su resistencia y facilidad de cuidado. Sus hojas en forma de corazón vienen en variedades verdes, amarillentas o jaspeadas, lo que la hace ideal para principiantes.',
    imagen: 'https://images.unsplash.com/photo-1622398925373-3f91b1a52dc1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1622398925373-3f91b1a52dc1?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    ],
    precio: 15.50,
    cuidados: {
      luz: 'Tolera poca luz, aunque crece mejor en luz indirecta brillante.',
      riego: 'Permite que el sustrato se seque entre riegos. Aproximadamente cada 1-2 semanas.',
      sustrato: 'Cualquier mezcla para macetas con buen drenaje. Tolera diferentes tipos de sustratos.',
      temperatura: 'Entre 18°C y 29°C. No tolera temperaturas bajo los 10°C.',
      humedad: 'Se adapta a niveles normales de humedad del hogar.',
      fertilizacion: 'Fertilizante básico para plantas de interior cada 2-3 meses.',
      problemas: 'Resistente a plagas y enfermedades. Las hojas marrones pueden indicar falta de agua o exceso de luz directa.'
    },
    detalles: {
      tipoLuz: 'Baja a media',
      frecuenciaRiego: '1-2 semanas',
      dificultad: 'Muy baja',
      tamanoMax: 'Hasta 10 metros de longitud',
      origen: 'Sudeste asiático',
      toxicidad: 'Tóxica para mascotas'
    },
    consejos: [
      'Ideal para colgar en macetas o dejar caer por estanterías.',
      'Puedes propagar fácilmente cortando un tallo con al menos un nodo.',
      'Una buena opción para oficinas y espacios con poca luz.'
    ]
  },
  {
    nombre: 'Lavanda',
    categoriaId: 'aromaticas',
    nombreCientifico: 'Lavandula',
    descripcion: 'La lavanda es una planta aromática perenne conocida por su hermoso color púrpura y su inconfundible fragancia. Además de ser decorativa, se utiliza en perfumería, cocina y tiene propiedades calmantes.',
    imagen: 'https://images.unsplash.com/photo-1458449853225-c7683c6dfb93?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1458449853225-c7683c6dfb93?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1468327768560-75b778cbb551?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    ],
    precio: 12.99,
    cuidados: {
      luz: 'Pleno sol, al menos 6 horas diarias.',
      riego: 'Escaso. Tolerante a la sequía una vez establecida.',
      sustrato: 'Bien drenado, arenoso y preferiblemente calcáreo.',
      temperatura: 'Resiste temperaturas de hasta -10°C según la variedad.',
      humedad: 'Prefiere ambientes secos. La humedad excesiva puede causar pudrición.',
      fertilizacion: 'Poco exigente. Un aporte anual de compost al inicio de primavera es suficiente.',
      problemas: 'Susceptible a pudrición radicular por exceso de agua. Vigilar pulgones y arañas rojas.'
    },
    detalles: {
      tipoLuz: 'Sol directo',
      frecuenciaRiego: 'Escaso, cuando el sustrato está seco',
      dificultad: 'Media',
      tamanoMax: '60-90 cm',
      origen: 'Región mediterránea',
      toxicidad: 'No tóxica'
    },
    consejos: [
      'Podar después de la floración para mantener su forma compacta.',
      'Cosecha las flores por la mañana cuando estén semi-abiertas para mayor intensidad aromática.',
      'Ideal para bordes de jardín, rocallas o macetas en terrazas soleadas.'
    ]
  },
  {
    nombre: 'Cactus Estrella',
    categoriaId: 'cactus',
    nombreCientifico: 'Astrophytum asterias',
    descripcion: 'El Cactus Estrella o Astrophytum asterias es una especie pequeña y redondeada con una forma distintiva de estrella de ocho puntas. Su superficie suele estar cubierta de pequeños puntos blancos que le dan un aspecto moteado.',
    imagen: 'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1909?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1509587584298-0f3b3a3a1909?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'https://images.unsplash.com/photo-1599009944997-3544e319b206?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    ],
    precio: 18.75,
    cuidados: {
      luz: 'Sol directo pero con protección en horas de máxima intensidad en verano.',
      riego: 'Muy escaso. Dejar secar completamente entre riegos. En invierno casi nulo.',
      sustrato: 'Muy bien drenado, mezcla específica para cactus.',
      temperatura: 'No tolera heladas. Temperatura mínima 5°C.',
      humedad: 'Ambiente seco. Evitar condensaciones.',
      fertilizacion: 'Fertilizante específico para cactus en primavera y verano, muy diluido.',
      problemas: 'Sensible a la pudrición por exceso de riego. Vigilar cochinillas.'
    },
    detalles: {
      tipoLuz: 'Sol directo filtrado',
      frecuenciaRiego: 'Muy escaso, cada 3-4 semanas en verano',
      dificultad: 'Baja',
      tamanoMax: '10-15 cm de diámetro',
      origen: 'México y Texas',
      toxicidad: 'No tóxica'
    },
    consejos: [
      'Ideal para coleccionistas por su forma única y lento crecimiento.',
      'Florece con flores amarillas en plantas maduras de más de 3-4 años.',
      'Manipular con cuidado aunque no tiene espinas prominentes.'
    ]
  },
  {
    nombre: 'Nenúfar',
    categoriaId: 'acuaticas',
    nombreCientifico: 'Nymphaea',
    descripcion: 'Los nenúfares son plantas acuáticas con hermosas flores que flotan sobre la superficie del agua. Sus grandes hojas circulares proporcionan sombra para los peces y ayudan a controlar las algas al bloquear la luz solar.',
    imagen: 'https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
    imagenes: [
      'https://images.unsplash.com/photo-1474557157379-8aa74a6ef541?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
      'https://www.bekiahogar.com/images/articulos/portada/96000/96232.jpg'
    ],
    precio: 35.99,
    cuidados: {
      luz: 'Pleno sol para mejor floración. Mínimo 6 horas diarias.',
      riego: 'Mantener siempre en agua. Profundidad ideal 30-60 cm según variedad.',
      sustrato: 'Arcilla pesada o sustrato específico para plantas acuáticas en cestas.',
      temperatura: 'Agua entre 18°C y 26°C. Algunas variedades son resistentes a inviernos suaves.',
      humedad: 'Siempre sumergida parcialmente.',
      fertilizacion: 'Tabletas fertilizantes específicas para plantas acuáticas cada 1-2 meses.',
      problemas: 'Pulgones en hojas emergentes y hongos. Vigilar posibles ataques de caracoles acuáticos.'
    },
    detalles: {
      tipoLuz: 'Sol directo',
      frecuenciaRiego: 'Siempre en agua',
      dificultad: 'Media-Alta',
      tamanoMax: '1-1.5 metros de extensión',
      origen: 'Distribución mundial',
      toxicidad: 'No tóxica'
    },
    consejos: [
      'Ideal para estanques y fuentes exteriores.',
      'Las flores se abren durante el día y se cierran por la noche.',
      'Complementar con plantas oxigenadoras para mantener el agua clara.',
      'Recortar hojas y flores muertas regularmente para mantener el estanque limpio.'
    ]
  }
];

// Función para cargar las categorías en Firestore
async function seedCategorias() {
  console.log('Iniciando carga de categorías...');
  
  for (const categoria of categorias) {
    try {
      await db.collection('categorias').doc(categoria.id).set(categoria);
      console.log(`Categoría añadida: ${categoria.nombre}`);
    } catch (error) {
      console.error(`Error al añadir categoría ${categoria.nombre}:`, error);
    }
  }
  
  console.log('Carga de categorías completada');
}

// Función para cargar las plantas en Firestore
async function seedPlantas() {
  console.log('Iniciando carga de plantas...');
  
  for (const planta of plantas) {
    try {
      await db.collection('plantas').add({
        ...planta,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`Planta añadida: ${planta.nombre}`);
    } catch (error) {
      console.error(`Error al añadir planta ${planta.nombre}:`, error);
    }
  }
  
  console.log('Carga de plantas completada');
}

// Ejecutar el proceso de carga de datos
async function seedDatabase() {
  try {
    await seedCategorias();
    await seedPlantas();
    console.log('Base de datos inicializada correctamente');
    process.exit(0);
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedDatabase();