const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
const SHIPDAY_API_KEY = '7V4pa0Wt8M.76gAlW3fOpW6gYhfSE7V'; // Using the key you provided

const driversToImport = [
  // Example driver:
  // {
  //   name: 'Juan Perez',
  //   email: 'juan.perez@example.com',
  //   phoneNumber: '+15551234567',
  //   vehicleType: 'CAR'
  // }
  // Add your drivers here
];

async function importDriversToShipdayAndFirestore() {
  console.log('Iniciando la importación de repartidores...');

  if (driversToImport.length === 0) {
    console.log('No hay repartidores para importar en la lista `driversToImport`. Agrega los datos de tus repartidores y vuelve a ejecutar.');
    return;
  }

  for (const driverData of driversToImport) {
    try {
      console.log(`Intentando crear a ${driverData.name} en Shipday...`);
      // 1. Create driver in Shipday
      const shipdayResponse = await fetch('https://api.shipday.com/driver/add', {
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
            vehicleType: driverData.vehicleType || 'CAR'
          }
        })
      });

      if (!shipdayResponse.ok) {
        const errorText = await response.text();
        throw new Error(`Error al crear a ${driverData.name} en Shipday: ${errorText}`);
      }

      const shipdayResult = await shipdayResponse.json();
      if (!shipdayResult.success) {
        throw new Error(`La API de Shipday devolvió un error para ${driverData.name}: ${shipdayResult.errorMessage}`);
      }
      
      const shipdayId = shipdayResult.id;
      console.log(`- Repartidor creado en Shipday: ${driverData.name} (ID de Shipday: ${shipdayId})`);

      // 2. Create document in Firestore
      const driverId = `shipday_${shipdayId}`;
      const driverDocRef = db.collection('drivers').doc(driverId);
      
      await driverDocRef.set({
        uid: driverId,
        shipdayId: shipdayId,
        personalInfo: {
          fullName: driverData.name,
          email: driverData.email,
          phone: driverData.phoneNumber,
          address: '', curp: '', rfc: '', nss: ''
        },
        vehicleInfo: { type: driverData.vehicleType || "CAR", brand: '', plate: '' },
        legal: {},
        documents: {},
        wallet: { currentBalance: 0, debtLimit: -500 },
        proStatus: { level: 'Bronce', points: 0 },
        operationalStatus: 'active',
      });
      console.log(`- Documento de repartidor creado en Firestore para ${driverData.name}`);

    } catch (error) {
      console.error(`Ocurrió un error procesando a ${driverData.name}:`, error.message);
    }
  }

  console.log('¡Proceso de importación completado!');
}

importDriversToShipdayAndFirestore();
