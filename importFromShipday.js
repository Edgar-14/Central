const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
const SHIPDAY_API_KEY = '7V4pa0Wt8M.76gAlW3fOpW6gYhfSE7V'; // Using the key you provided

const driversToImport = [
    { name: 'Pablo Ernesto Gaspar Castro', phoneNumber: '+523121045017', email: 'pablogasparcastro3@gmail.com', status: 'En servicio' },
    { name: 'Juan Carlos Rojas Garcia', phoneNumber: '+523123096018', email: 'juancarlos21roj@gmail.com', status: 'Fuera de servicio' },
    // ... (the rest of the drivers)
];

async function importDriversToShipdayAndFirestore() {
  console.log('Iniciando la importación de repartidores desde Shipday...');

  if (driversToImport.length === 0) {
    console.log('No hay repartidores para importar en la lista `driversToImport`.');
    return;
  }

  for (const driverData of driversToImport) {
    try {
      console.log(`Intentando crear a ${driverData.name} en Shipday...`);
      // 1. Create driver in Shipday
      const shipdayResponse = await fetch('https://api.shipday.com/v1/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${SHIPDAY_API_KEY}`
        },
        body: JSON.stringify({
          name: driverData.name,
          email: driverData.email,
          phoneNumber: driverData.phoneNumber,
          carrier: {
            vehicleType: 'MOTORCYCLE' // Using Motorcycle as default
          }
        })
      });

      const responseBodyText = await shipdayResponse.text();

      if (!shipdayResponse.ok) {
        throw new Error(`Error al crear a ${driverData.name} en Shipday: ${responseBodyText}`);
      }
      
      const shipdayResult = JSON.parse(responseBodyText);
      
      if (!shipdayResult.id) {
          throw new Error(`La API de Shipday devolvió un error para ${driverData.name}: ${responseBodyText}`);
      }
      
      const shipdayId = shipdayResult.id;
      console.log(`- Repartidor creado en Shipday: ${driverData.name} (ID de Shipday: ${shipdayId})`);

      // 2. Create document in Firestore
      const driverId = `shipday_${shipdayId}`;
      const driverDocRef = db.collection('drivers').doc(driverId);
      
      const operationalStatus = driverData.status === 'En servicio' ? 'active' : 'inactive';

      await driverDocRef.set({
        uid: driverId,
        shipdayId: shipdayId,
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
        operationalStatus: operationalStatus,
      }, { merge: true });
      console.log(`- Documento de repartidor creado/actualizado en Firestore para ${driverData.name}`);

    } catch (error) {
      console.error(`Ocurrió un error procesando a ${driverData.name}:`, error.message);
    }
  }

  console.log('¡Proceso de importación completado!');
}

importDriversToShipdayAndFirestore();
