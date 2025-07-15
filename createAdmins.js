
// This script is for development purposes only.
// It allows for the creation of admin, superadmin, and test driver users
// directly in Firebase Authentication and Firestore with the necessary custom claims and data.
// To run it, you need to have Node.js and Firebase Admin SDK set up.
// Usage: node createAdmins.js

import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

// IMPORTANT: Replace with the path to your Firebase service account key
import serviceAccount from './befast-central-firebase-adminsdk-qg3xw-6421a2245c.json' assert { type: 'json' };

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const auth = admin.auth();
const db = getFirestore(app);

// --- Configuration ---
// Add the users you want to create or update here.
const usersToCreate = [
  // Super Administrator
  {
    email: 'e.josafat.gaspar@gmail.com',
    password: 'SuperAdminPassword123!',
    role: 'superadmin',
    displayName: 'Super Admin',
  },
  // Administrator
  {
    email: 'admin1@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    displayName: 'Admin User 1',
  },
  {
    email: 'admin2@example.com',
    password: 'AdminPassword123!',
    role: 'admin',
    displayName: 'Admin User 2',
  },
  // Test Driver Account (fully approved and active)
  {
    email: 'ejosgas@gmail.com',
    password: '1234567a',
    role: 'driver',
    displayName: 'E Josafat Gaspar',
    firestoreData: {
      fullName: 'E Josafat Gaspar',
      email: 'ejosgas@gmail.com',
      phone: '3121112233',
      shipdayId: 98765,
      applicationStatus: 'approved_manual_sync',
      operationalStatus: 'active',
      createdAt: new Date(),
      approvedAt: new Date(),
      personalInfo: {
        fullName: 'E Josafat Gaspar',
        email: 'ejosgas@gmail.com',
        phone: '3121112233',
        address: 'Av. Siempre Viva 742',
        curp: 'GASJ850101HCSLN01',
        rfc: 'GASJ850101ABC',
        nss: '12345678901',
      },
      vehicleInfo: {
        type: 'Motocicleta',
        brand: 'Italika',
        plate: 'XYZ-123',
      },
      documents: {
        ineUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media',
        licenseUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media',
        addressProofUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media',
        taxIdUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media',
        circulationCardUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media',
        insuranceUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/legal%2FContrato-BeFast-Repartidor-Ejemplo.pdf?alt=media',
      },
      legal: {
        contractVersion: 'v1.2',
        signatureTimestamp: Date.now(),
        ipAddress: '127.0.0.1',
      },
      wallet: {
        currentBalance: 150.50,
        debtLimit: -500,
      },
      proStatus: {
        level: 'Plata',
        points: 250,
      },
    },
  },
];
// --- End Configuration ---


const createOrUpdateUser = async (userData) => {
  const { email, password, role, displayName, firestoreData } = userData;

  try {
    // Check if user exists
    let userRecord = await auth.getUserByEmail(email).catch(() => null);

    if (userRecord) {
      // User exists, update them
      console.log(`Usuario ${email} ya existe. Actualizando...`);
      await auth.updateUser(userRecord.uid, {
        password: password,
        displayName: displayName,
      });
      userRecord = await auth.getUser(userRecord.uid); // Re-fetch to confirm update
    } else {
      // User does not exist, create them
      console.log(`Creando nuevo usuario: ${email}...`);
      userRecord = await auth.createUser({
        email: email,
        password: password,
        displayName: displayName,
      });
    }

    // Set custom claims for role-based access control
    await auth.setCustomUserClaims(userRecord.uid, { role: role });
    console.log(`Rol '${role}' asignado a ${email}.`);

    // If it's a driver, create or update their Firestore document
    if (role === 'driver' && firestoreData) {
        const docRef = db.collection('drivers').doc(email.toLowerCase());
        await docRef.set({ ...firestoreData, uid: userRecord.uid }, { merge: true });
        console.log(`Documento de Firestore creado/actualizado para el repartidor ${email}.`);
    }

    console.log(`--- Proceso completado para ${email} ---\n`);

  } catch (error) {
    console.error(`Error procesando al usuario ${email}:`, error.message);
  }
};

const run = async () => {
  for (const user of usersToCreate) {
    await createOrUpdateUser(user);
  }
  console.log('¡Proceso de creación de usuarios finalizado!');
  process.exit(0);
};

run();
