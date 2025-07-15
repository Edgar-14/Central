import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {beforeUserCreated} from "firebase-functions/v2/identity";

initializeApp();

// 1. beforeUserCreated: Triggered before a new user is created.
export const setupnewuser = beforeUserCreated((event) => {
  const user = event.data;
  if (!user) {
    throw new HttpsError("internal", "No user data provided for creation.");
  }

  const driverDocRef = getFirestore().collection("drivers").doc(user.uid);

  return driverDocRef.set({
    uid: user.uid,
    personalInfo: {
      email: user.email || "",
      fullName: user.displayName || "",
      phone: "",
      address: "",
      curp: "",
      rfc: "",
      nss: "",
    },
    vehicleInfo: { type: "Motocicleta", brand: "", plate: "" },
    legal: {},
    documents: {},
    wallet: { currentBalance: 0, debtLimit: -500 },
    proStatus: { level: "Bronce", points: 0 },
    operationalStatus: "uninitialized",
    shipdayId: null,
  });
});

interface SubmitApplicationData {
    personalInfo: Record<string, unknown>;
    documents: Record<string, string>;
    legal: Record<string, unknown>;
}

// 2. submitApplication: Called from the frontend to submit the application.
export const submitapplication = onCall<SubmitApplicationData>((request) => {
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
    }
    const { uid } = request.auth.token;
    const { personalInfo, documents, legal } = request.data;
    const driverDocRef = getFirestore().collection("drivers").doc(uid);
    
    return driverDocRef.update({
        personalInfo,
        documents,
        legal,
        operationalStatus: "pending_validation",
        applicationSubmittedAt: FieldValue.serverTimestamp(),
    }).then(() => {
        return { success: true, message: "Solicitud enviada con éxito." };
    });
});

// 3. activateDriver: Called by an admin to activate a driver.
export const activatedriver = onCall<{driverId: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden activar repartidores.");
    }
    
    const { driverId } = request.data;
    if (!driverId) {
        throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'driverId'.");
    }

    await getAuth().setCustomUserClaims(driverId, { role: "driver" });

    const driverDocRef = getFirestore().collection("drivers").doc(driverId);
    await driverDocRef.update({
        operationalStatus: "active",
    });
    
    return { success: true, message: "Repartidor activado con éxito." };
});

// 4. rejectApplication: Called by an admin to reject an application.
export const rejectapplication = onCall<{driverId: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden rechazar solicitudes.");
    }

    const { driverId } = request.data;
    if (!driverId) {
        throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'driverId'.");
    }

    const driverDocRef = getFirestore().collection("drivers").doc(driverId);
    await driverDocRef.update({
        operationalStatus: "rejected",
    });

    return { success: true, message: "Solicitud rechazada." };
});
