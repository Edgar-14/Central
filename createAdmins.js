
const admin = require('firebase-admin');

// Initialize the app with a service account, granting admin privileges
// Ensure you have GOOGLE_APPLICATION_CREDENTIALS set in your environment
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = admin.auth();
const db = admin.firestore();

const usersToCreate = [
  {
    email: 'elkochiio14@gmail.com',
    password: 'Sferra09.',
    displayName: 'Edgar Garcia',
    customClaims: { role: 'superadmin' }
  },
  {
    email: 'revisiones@befastapp.com.mx',
    password: '1234567a',
    displayName: 'Francisco Maturano',
    customClaims: { role: 'admin' }
  },
  {
    email: 'documentos@befastapp.com.mx',
    password: '1234567a',
    displayName: 'Saul Aldrete',
    customClaims: { role: 'admin' }
  }
];

const fictitiousDriver = {
  email: 'repartidor.ficticio@example.com',
  password: 'password123',
  fullName: 'Juan Repartidor Ficticio',
  phone: '555-123-4567',
  personalInfo: {
    address: 'Calle Falsa 123, Colonia Centro',
    curp: 'XXXX010101HXXXXX01',
    rfc: 'XXXX010101XXX',
    nss: '12345678901',
  },
  vehicleInfo: {
    type: 'Motocicleta',
    brand: 'Italika FT150',
    plate: 'XYZ-123',
  },
  legal: {
    contractVersion: 'v1.2',
    signatureTimestamp: Date.now(),
    ipAddress: '127.0.0.1',
  },
  documents: {
    ineUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/path%2Fto%2Fdummy.pdf?alt=media',
    licenseUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/path%2Fto%2Fdummy.pdf?alt=media',
    insuranceUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/path%2Fto%2Fdummy.pdf?alt=media',
    addressProofUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/path%2Fto%2Fdummy.pdf?alt=media',
    taxIdUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/path%2Fto%2Fdummy.pdf?alt=media',
    circulationCardUrl: 'https://firebasestorage.googleapis.com/v0/b/befast-central.appspot.com/o/path%2Fto%2Fdummy.pdf?alt=media',
  }
};


async function createUsers() {
  console.log('Creando cuentas de administrador...');
  for (const userData of usersToCreate) {
    try {
      let userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      });
      await auth.setCustomUserClaims(userRecord.uid, userData.customClaims);
      console.log(`- Cuenta de admin creada y rol asignado para: ${userData.email} (Rol: ${userData.customClaims.role})`);
    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`- La cuenta para ${userData.email} ya existe. Asignando rol...`);
        const userRecord = await auth.getUserByEmail(userData.email);
        await auth.setCustomUserClaims(userRecord.uid, userData.customClaims);
        console.log(`- Rol asignado para: ${userData.email} (Rol: ${userData.customClaims.role})`);
      } else {
        console.error(`Error creando cuenta admin para ${userData.email}:`, error);
      }
    }
  }

  console.log('\nCreando repartidor ficticio...');
  try {
    const userRecord = await auth.createUser({
      email: fictitiousDriver.email,
      password: fictitiousDriver.password,
      displayName: fictitiousDriver.fullName,
      phoneNumber: fictitiousDriver.phone,
    });
    
    await auth.setCustomUserClaims(userRecord.uid, { role: 'driver' });
    console.log(`- Cuenta de Auth creada para repartidor ficticio: ${fictitiousDriver.email}`);
    
    const docRef = db.collection('drivers').doc(fictitiousDriver.email);
    
    await docRef.set({
      uid: userRecord.uid,
      email: fictitiousDriver.email,
      fullName: fictitiousDriver.fullName,
      phone: fictitiousDriver.phone,
      personalInfo: fictitiousDriver.personalInfo,
      vehicleInfo: fictitiousDriver.vehicleInfo,
      legal: fictitiousDriver.legal,
      documents: fictitiousDriver.documents,
      wallet: { currentBalance: 150.75, debtLimit: -500 },
      proStatus: { level: 'Plata', points: 1250 },
      applicationStatus: 'approved',
      operationalStatus: 'active',
      shipdayId: `fictional_${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      applicationSubmittedAt: admin.firestore.FieldValue.serverTimestamp(),
      approvedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log(`- Documento de Firestore creado para repartidor ficticio.`);

  } catch (error) {
     if (error.code === 'auth/email-already-exists') {
        console.log(`- La cuenta para el repartidor ficticio ${fictitiousDriver.email} ya existe.`);
     } else {
        console.error('Error creando repartidor ficticio:', error);
     }
  }

  console.log('\nProceso completado.');
}

createUsers();
