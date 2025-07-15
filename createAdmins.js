const admin = require('firebase-admin');

// Initialize the app with a service account, granting admin privileges
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

const auth = admin.auth();

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

async function createAdminUsers() {
  console.log('Creando cuentas de administrador...');
  for (const userData of usersToCreate) {
    try {
      let userRecord = await auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      });
      await auth.setCustomUserClaims(userRecord.uid, userData.customClaims);
      console.log(`- Cuenta creada y rol asignado para: ${userData.email} (Rol: ${userData.customClaims.role})`);
      
      // Create admin document in Firestore
      await admin.firestore().collection('admins').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.customClaims.role,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`- Documento de administrador creado para: ${userData.email}`);

    } catch (error) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`- La cuenta para ${userData.email} ya existe. Asignando rol...`);
        const userRecord = await auth.getUserByEmail(userData.email);
        await auth.setCustomUserClaims(userRecord.uid, userData.customClaims);
        console.log(`- Rol asignado para: ${userData.email} (Rol: ${userData.customClaims.role})`);
      } else {
        console.error(`Error creando cuenta para ${userData.email}:`, error);
      }
    }
  }
  console.log('Proceso completado.');
}

createAdminUsers();
