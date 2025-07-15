import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/v2/https";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import {defineString} from "firebase-functions/params";
import createShipday from 'shipday';

initializeApp();

const SHIPDAY_API_KEY = defineString("SHIPDAY_API_KEY");
const SHIPDAY_WEBHOOK_SECRET = defineString("SHIPDAY_WEBHOOK_SECRET");

const shipday = createShipday(SHIPDAY_API_KEY.value());

// 1. beforeUserCreate: Triggered before a new user is created.
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

    const driverDocRef = getFirestore().collection("drivers").doc(driverId);
    const driverDoc = await driverDocRef.get();

    if (!driverDoc.exists) {
        throw new HttpsError("not-found", "No se encontró el repartidor.");
    }
    const driverData = driverDoc.data();

    const shipdayResult = await shipday.driverService.addDriver({
        name: driverData?.personalInfo.fullName,
        email: driverData?.personalInfo.email,
        phoneNumber: driverData?.personalInfo.phone,
    });
    
    if (!shipdayResult.success) {
        throw new HttpsError("internal", `Error al crear el repartidor en Shipday: ${shipdayResult.errorMessage}`);
    }
    
    const shipdayId = shipdayResult.id;


    // Set custom claim for the user
    await getAuth().setCustomUserClaims(driverId, { role: "driver" });

    // Update the driver's status and shipdayId in Firestore
    await driverDocRef.update({
        operationalStatus: "active",
        shipdayId: shipdayId
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

// 5. suspendDriver & restrictDriver
export const suspenddriver = onCall<{driverId: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden suspender repartidores.");
    }
    const { driverId } = request.data;
    await getFirestore().collection("drivers").doc(driverId).update({ operationalStatus: "suspended" });
    return { success: true, message: "Repartidor suspendido." };
});

export const restrictdriver = onCall<{driverId: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden restringir repartidores.");
    }
    const { driverId } = request.data;
    await getFirestore().collection("drivers").doc(driverId).update({ operationalStatus: "restricted_debt" });
    return { success: true, message: "Repartidor restringido por deuda." };
});


// 6. shipdayWebhook: Receives order updates from Shipday to update driver wallets.
export const shipdaywebhook = onRequest(async (req, res) => {
  const secret = req.headers['x-shipday-secret'];
  if (secret !== SHIPDAY_WEBHOOK_SECRET.value()) {
      console.warn("Recibida solicitud de webhook no autorizada.");
      res.status(401).send("Unauthorized");
      return;
  }
  
  const { orderId, driverId, eventType, order } = req.body;

  if (!driverId || !orderId || !eventType) {
    res.status(400).send("Missing required fields.");
    return;
  }
  
  if (eventType !== 'order_delivered') {
    res.status(200).send("Event not relevant for wallet processing.");
    return;
  }

  const driverDocRef = getFirestore().collection("drivers").doc(driverId);

  try {
    await getFirestore().runTransaction(async (transaction) => {
      const driverDoc = await transaction.get(driverDocRef);
      if (!driverDoc.exists) {
        throw new Error(`Driver with ID ${driverId} not found.`);
      }

      const deliveryFee = order?.deliveryFee || 0;
      const tip = order?.tip || 0;
      const commission = deliveryFee * 0.20; // Example 20% commission
      const totalCredit = deliveryFee + tip;
      
      const newBalance = (driverDoc.data()?.wallet.currentBalance || 0) + totalCredit - commission;

      transaction.update(driverDocRef, { "wallet.currentBalance": newBalance });

      const transactionRef = driverDocRef.collection("transactions").doc();
      transaction.set(transactionRef, {
        date: FieldValue.serverTimestamp(),
        type: 'credit_delivery',
        amount: totalCredit,
        orderId,
        description: `Entrega completada: +${totalCredit.toFixed(2)}`,
      });
      
      const commissionRef = driverDocRef.collection("transactions").doc();
      transaction.set(commissionRef, {
        date: FieldValue.serverTimestamp(),
        type: 'debit_commission',
        amount: -commission,
        orderId,
        description: `Comisión de servicio: -${commission.toFixed(2)}`,
      });
    });

    res.status(200).send("Wallet updated successfully.");
  } catch (error) {
    console.error(`Error processing webhook for order ${orderId}:`, error);
    res.status(500).send("Internal Server Error");
  }
});
