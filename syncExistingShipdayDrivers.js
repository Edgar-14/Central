
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Este script es para una sincronización INICIAL.
// Lee los repartidores existentes en Shipday y los guarda en Firestore.

// Asegúrate de que tu entorno esté autenticado. 
// Por ejemplo, ejecutando 'gcloud auth application-default login' en tu terminal.
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'befast-central', // Reemplaza con tu Project ID de Firebase si es necesario
});

const db = admin.firestore();
const SHIPDAY_API_KEY = '7V4pa0Wt8M.76gAlW6gYhfSE7V'; 

/**
 * Fetches active drivers from the Shipday API.
 */
async function fetchDriversFromShipday() {
  console.log('Iniciando la obtención de repartidores desde la API de Shipday...');
  try {
    const response = await fetch('https://api.shipday.com/v1/drivers', {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'X-API-KEY': SHIPDAY_API_KEY,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Error en la API de Shipday: ${response.status} ${response.statusText} - ${errorBody}`);
    }

    const data = await response.json();
    console.log(`Éxito: Se encontraron ${data.length} repartidores en Shipday.`);
    return data;
  } catch (error) {
    console.error('Error crítico al obtener los repartidores de Shipday:', error);
    return []; // Devolver un array vacío para no continuar en caso de error.
  }
}

/**
 * Guarda o actualiza los repartidores en Firestore.
 * Usa el email como ID de documento para evitar duplicados.
 */
async function saveDriversToFirestore(drivers) {
  if (!drivers || drivers.length === 0) {
    console.log('No hay repartidores para guardar en Firestore.');
    return;
  }

  console.log('Iniciando la escritura en la base de datos Firestore...');
  const batch = db.batch();
  let successfulImports = 0;

  for (const driver of drivers) {
    // Shipday provee el nombre completo en el campo 'name'.
    const fullName = driver.name;

    if (!driver.email || !fullName) {
      console.warn(`ADVERTENCIA: Omitiendo repartidor por falta de email o nombre. ID de Shipday: ${driver.id}`);
      continue;
    }

    // Usar el email del repartidor como ID único en Firestore para evitar duplicados.
    const docRef = db.collection('drivers').doc(driver.email.toLowerCase());

    const driverData = {
      // Datos del perfil
      fullName: fullName,
      email: driver.email.toLowerCase(),
      phone: driver.phoneNumber,
      
      // Datos de la aplicación
      status: 'approved', // Asumimos que todos los repartidores existentes están aprobados.
      applicationStatus: 'approved',
      
      // Datos de integración
      shipdayId: driver.id, // Guardar el ID de Shipday es una excelente práctica.
      lastSyncedFromShipday: new Date(),
    };

    // Usamos 'set' con 'merge: true' para no sobreescribir datos existentes si el repartidor ya existía.
    batch.set(docRef, driverData, { merge: true });
    successfulImports++;
  }

  try {
    await batch.commit();
    console.log(`¡Sincronización completada! ${successfulImports} repartidores fueron guardados/actualizados en Firestore.`);
  } catch (error) {
    console.error('Error crítico al guardar los repartidores en Firestore:', error);
  }
}

/**
 * Función principal que orquesta el proceso.
 */
async function main() {
  console.log('--- Proceso de Sincronización Inicial de Repartidores ---');
  const shipdayDrivers = await fetchDriversFromShipday();
  await saveDriversToFirestore(shipdayDrivers);
  console.log('--- Proceso Terminado ---');
}

main().catch(error => {
    console.error("El proceso principal falló:", error)
});
