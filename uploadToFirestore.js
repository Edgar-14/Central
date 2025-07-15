const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();

const driversToUpload = [
    { name: 'Pablo Ernesto Gaspar Castro', phoneNumber: '+523121045017', email: 'pablogasparcastro3@gmail.com', status: 'En servicio' },
    { name: 'Juan Carlos Rojas Garcia', phoneNumber: '+523123096018', email: 'juancarlos21roj@gmail.com', status: 'Fuera de servicio' },
    { name: 'Elías Chavira romero', phoneNumber: '+523123037023', email: 'chaviraelias20@gmail.com', status: 'Fuera de servicio' },
    { name: 'Ricardo Esteban Cervantes cortes', phoneNumber: '+523121227753', email: 'riikardooo1999@gmail.com', status: 'Fuera de servicio' },
    { name: 'Daniel Alejandro mambrila luis', phoneNumber: '+523143528870', email: 'cadis210795@gmail.com', status: 'Fuera de servicio' },
    { name: 'Ernesto López montoya', phoneNumber: '+523346672313', email: 'el9096607@gmail.com', status: 'Fuera de servicio' },
    { name: 'Jorge Eduardo vizcaino', phoneNumber: '+523125937257', email: 'jorvizcol@gmail.com', status: 'Fuera de servicio' },
    { name: 'Jorge Alberto dela cruz macias', phoneNumber: '+523122440011', email: 'delacruzmaciasjorge@gmail.com', status: 'Fuera de servicio' },
    { name: 'Rafael Alejandro Romero arechiga', phoneNumber: '+523121742783', email: 'romeroarechigar@gmail.com', status: 'Fuera de servicio' },
    { name: 'humberto Gonzales carillo', phoneNumber: '+523123009130', email: 'humberto.893.hg@gmail.com', status: 'Fuera de servicio' },
    { name: 'Mario Alfredo Gonzales zamora', phoneNumber: '+523121769210', email: 'marioalfredomannatech@gmail.com', status: 'Fuera de servicio' },
    { name: 'Edgar serrano peralta', phoneNumber: '+523121672002', email: '3121684803es@gmail.com', status: 'Fuera de servicio' },
    { name: 'Marisol rubio urzua', phoneNumber: '+523121746462', email: 'pasiondeportivaplus@gmail.com', status: 'Fuera de servicio' },
    { name: 'cesar Antonio angel de alba', phoneNumber: '+523330629980', email: 'cesarrangelallcaraz@gmail.com', status: 'Fuera de servicio' },
    { name: 'Oscar Gabriel Ochoa lopez', phoneNumber: '+523125959635', email: 'oscargabrielochoa6@gmail.com', status: 'Fuera de servicio' },
    { name: 'Jennifer Arlette Martínez larios', phoneNumber: '+523125508256', email: 'Martinezjenni2020@gmail.com', status: 'Fuera de servicio' },
    { name: 'Juan Carlos Medrano garcia', phoneNumber: '+523121069557', email: 'jkleomedrano@gmail.com', status: 'Fuera de servicio' },
    { name: 'Juan Manuel Vega ponce', phoneNumber: '+523121416809', email: 'juanmanuelvegaponce504@gmail.com', status: 'Fuera de servicio' },
    { name: 'Carlos Enrique mendez', phoneNumber: '+523123391124', email: 'carlosenriquemendeznavarro@gmail.com', status: 'Fuera de servicio' },
    { name: 'Israel Valencia bartolo', phoneNumber: '+523121541174', email: 'israelvalencia2@gmail.com', status: 'Fuera de servicio' },
    // ... (include all other drivers)
];

async function uploadDriversToFirestore() {
  console.log('Iniciando la carga de repartidores a Firestore...');

  for (const driverData of driversToUpload) {
    const uid = `imported_${driverData.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const driverDocRef = db.collection('drivers').doc(uid);

    const newDriverData = {
        uid: uid,
        shipdayId: null, // No Shipday ID for now
        personalInfo: {
          fullName: driverData.name,
          email: driverData.email,
          phone: driverData.phoneNumber,
          address: '', curp: '', rfc: '', nss: ''
        },
        vehicleInfo: { type: "Motocicleta", brand: '', plate: '' },
        legal: {},
        documents: {},
        wallet: { currentBalance: 0, debtLimit: -500 },
        proStatus: { level: 'Bronce', points: 0 },
        operationalStatus: driverData.status === 'En servicio' ? 'active' : 'inactive',
    };
    
    await driverDocRef.set(newDriverData, { merge: true });
    console.log(`- Documento creado/actualizado para: ${driverData.name}`);
  }

  console.log('¡Carga a Firestore completada con éxito!');
}

uploadDriversToFirestore();
