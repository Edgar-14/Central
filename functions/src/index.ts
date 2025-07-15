
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";

initializeApp();

// Define secrets and parameters
const SHIPDAY_API_KEY = defineString("SHIPDAY_API_KEY");

// 1. beforeUserCreate: Triggered before a new user is created in Firebase Auth.
// It pre-creates a corresponding document in Firestore.
export const setupnewuser = beforeUserCreated(async (event) => {
  const user = event.data;
  // Use email as the document ID for uniqueness
  const docId = user.email?.toLowerCase();
  if (!docId) {
    throw new HttpsError("invalid-argument", "El correo electrónico es requerido para crear un repartidor.");
  }

  const driverDocRef = getFirestore().collection("drivers").doc(docId);

  await driverDocRef.set({
    uid: user.uid,
    email: docId,
    fullName: user.displayName || "",
    phone: user.phoneNumber || "",
    status: "uninitialized",
    applicationStatus: "step1_account_created",
    createdAt: FieldValue.serverTimestamp(),
    // Initialize other fields
    personalInfo: {},
    vehicleInfo: {},
    legal: {},
    documents: {},
    wallet: { currentBalance: 0, debtLimit: -500 },
    proStatus: { level: "Bronce", points: 0 },
    shipdayId: null,
  });
});

interface SubmitApplicationData {
    personalInfo: Record<string, unknown>;
    documents: Record<string, string>;
    legal: Record<string, unknown>;
}

// 2. submitApplication: Called from the frontend when a user submits their application form.
export const submitapplication = onCall<SubmitApplicationData>((request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
    }
    const docId = request.auth.token.email?.toLowerCase();
     if (!docId) {
        throw new HttpsError("invalid-argument", "El correo electrónico del usuario no está disponible.");
    }

    const { personalInfo, documents, legal } = request.data;
    const driverDocRef = getFirestore().collection("drivers").doc(docId);
    
    return driverDocRef.update({
        personalInfo,
        documents,
        legal,
        applicationStatus: "pending_review",
        applicationSubmittedAt: FieldValue.serverTimestamp(),
    }).then(() => {
        return { success: true, message: "Solicitud enviada con éxito." };
    });
});

// 3. approveApplication: Called by an admin to approve a driver's application.
// This function creates the driver in Shipday and activates the user.
export const approveapplication = onCall<{email: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden activar repartidores.");
    }
    
    const email = request.data.email?.toLowerCase();
    if (!email) {
        throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'email'.");
    }

    const driverDocRef = getFirestore().collection("drivers").doc(email);
    const driverDoc = await driverDocRef.get();

    if (!driverDoc.exists) {
        throw new HttpsError("not-found", `No se encontró un repartidor con el correo ${email}.`);
    }
    const driverData = driverDoc.data();
    if (!driverData) {
        throw new HttpsError("internal", "No se pudieron leer los datos del repartidor.");
    }

    console.log(`Iniciando creación en Shipday para: ${driverData.fullName}`);
    
    // Step 1: Create the driver in Shipday
    const shipdayResponse = await fetch("https://api.shipday.com/v1/drivers", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': SHIPDAY_API_KEY.value(),
        },
        body: JSON.stringify({
            name: driverData.fullName,
            email: driverData.email,
            phoneNumber: driverData.phone,
            // You can add more fields here if needed, e.g., vehicle type
        })
    });

    if (!shipdayResponse.ok) {
        const errorText = await shipdayResponse.text();
        console.error("Error al crear repartidor en Shipday:", errorText);
        throw new HttpsError("internal", `Error al crear el repartidor en Shipday: ${errorText}`);
    }
    const shipdayResult = await shipdayResponse.json() as {id: number};
    const shipdayId = shipdayResult.id;
    console.log(`Repartidor creado en Shipday con ID: ${shipdayId}`);

    // Step 2: Set custom claim for the user in Firebase Auth
    await getAuth().setCustomUserClaims(driverData.uid, { role: "driver" });
    console.log(`Claim 'driver' asignado al usuario con UID: ${driverData.uid}`);

    // Step 3: Update the driver's status and shipdayId in Firestore
    await driverDocRef.update({
        status: "approved",
        applicationStatus: "approved",
        shipdayId: shipdayId,
        approvedAt: FieldValue.serverTimestamp(),
    });
    console.log(`Documento en Firestore actualizado para ${email}.`);
    
    return { success: true, message: "Repartidor aprobado y activado con éxito." };
});

// Other administrative functions...
export const rejectapplication = onCall<{email: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden rechazar solicitudes.");
    }
    const email = request.data.email?.toLowerCase();
    if (!email) {
        throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'email'.");
    }

    const driverDocRef = getFirestore().collection("drivers").doc(email);
    await driverDocRef.update({
        status: "rejected",
        applicationStatus: "rejected",
    });
    return { success: true, message: "Solicitud rechazada." };
});

export const suspenddriver = onCall<{driverId: string}>(async (request) => { 
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden suspender repartidores.");
    }
    const driverId = request.data.driverId; // This is the email
    await getFirestore().collection("drivers").doc(driverId).update({ operationalStatus: "suspended" });
    return { success: true, message: "Repartidor suspendido." };
});

export const restrictdriver = onCall<{driverId: string}>(async (request) => { 
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden restringir repartidores.");
    }
    const driverId = request.data.driverId; // This is the email
    await getFirestore().collection("drivers").doc(driverId).update({ operationalStatus: "restricted_debt" });
    return { success: true, message: "Repartidor restringido por deuda." };
});
