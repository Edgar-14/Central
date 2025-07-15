
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/v2/https";
import {beforeUserCreated} from "firebase-functions/v2/identity";
import {defineString} from "firebase-functions/params";

initializeApp();

const SHIPDAY_API_KEY = defineString("SHIPDAY_API_KEY");
const SHIPDAY_WEBHOOK_SECRET = defineString("SHIPDAY_WEBHOOK_SECRET");

export const setupnewuser = beforeUserCreated(async (event) => {
  const user = event.data;
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
    applicationStatus: "step1_account_created",
    operationalStatus: "uninitialized",
    createdAt: FieldValue.serverTimestamp(),
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

export const submitapplication = onCall<SubmitApplicationData>((request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
    const docId = request.auth.token.email?.toLowerCase();
    if (!docId) throw new HttpsError("invalid-argument", "El correo electrónico del usuario no está disponible.");

    const { personalInfo, documents, legal } = request.data;
    const driverDocRef = getFirestore().collection("drivers").doc(docId);
    
    return driverDocRef.update({
        personalInfo,
        documents,
        legal,
        applicationStatus: "pending_review",
        operationalStatus: "pending_validation",
        applicationSubmittedAt: FieldValue.serverTimestamp(),
    }).then(() => ({ success: true, message: "Solicitud enviada con éxito." }));
});

export const approveapplication = onCall<{email: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden activar repartidores.");
    }
    
    const email = request.data.email?.toLowerCase();
    if (!email) throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'email'.");

    const driverDocRef = getFirestore().collection("drivers").doc(email);
    const driverDoc = await driverDocRef.get();

    if (!driverDoc.exists) throw new HttpsError("not-found", `No se encontró un repartidor con el correo ${email}.`);
    const driverData = driverDoc.data();
    if (!driverData) throw new HttpsError("internal", "No se pudieron leer los datos del repartidor.");

    const response = await fetch("https://api.shipday.com/v1/drivers", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': SHIPDAY_API_KEY.value(),
        },
        body: JSON.stringify({
            name: driverData.fullName,
            email: driverData.email,
            phoneNumber: driverData.phone,
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Error al crear repartidor en Shipday:", errorText);
        throw new HttpsError("internal", `Error al crear el repartidor en Shipday: ${errorText}`);
    }
    const shipdayResult = await response.json() as {id: number};
    
    await getAuth().setCustomUserClaims(driverData.uid, { role: "driver" });

    await driverDocRef.update({
        applicationStatus: "approved",
        operationalStatus: "active",
        shipdayId: shipdayResult.id,
        approvedAt: FieldValue.serverTimestamp(),
    });
    
    return { success: true, message: "Repartidor aprobado y activado con éxito." };
});

export const rejectapplication = onCall<{email: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden rechazar solicitudes.");
    }
    const email = request.data.email?.toLowerCase();
    if (!email) throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'email'.");

    const driverDocRef = getFirestore().collection("drivers").doc(email);
    await driverDocRef.update({
        applicationStatus: "rejected",
        operationalStatus: "rejected",
    });
    return { success: true, message: "Solicitud rechazada." };
});

export const suspenddriver = onCall<{driverId: string}>(async (request) => { 
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden suspender repartidores.");
    }
    const driverId = request.data.driverId;
    await getFirestore().collection("drivers").doc(driverId).update({ operationalStatus: "suspended" });
    return { success: true, message: "Repartidor suspendido." };
});

export const restrictdriver = onCall<{driverId: string}>(async (request) => { 
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden restringir repartidores.");
    }
    const driverId = request.data.driverId;
    await getFirestore().collection("drivers").doc(driverId).update({ operationalStatus: "restricted_debt" });
    return { success: true, message: "Repartidor restringido por deuda." };
});

export const recordPayout = onCall<{driverEmail: string, amount: number, notes?: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden registrar pagos.");
    }

    const { driverEmail, amount, notes } = request.data;
    if (!driverEmail || !amount) {
        throw new HttpsError("invalid-argument", "Se requiere email del repartidor y monto.");
    }
    if (amount <= 0) {
        throw new HttpsError("invalid-argument", "El monto debe ser positivo.");
    }
    
    const driverDocRef = getFirestore().collection("drivers").doc(driverEmail);
    
    try {
        await getFirestore().runTransaction(async (transaction) => {
            const driverDoc = await transaction.get(driverDocRef);
            if (!driverDoc.exists) {
                throw new HttpsError("not-found", `No se encontró al repartidor ${driverEmail}`);
            }
            
            const currentBalance = driverDoc.data()?.wallet.currentBalance || 0;
            const newBalance = currentBalance - amount;

            transaction.update(driverDocRef, { "wallet.currentBalance": newBalance });

            const transactionRef = driverDocRef.collection("transactions").doc();
            transaction.set(transactionRef, {
                date: FieldValue.serverTimestamp(),
                type: 'payout',
                amount: -amount,
                description: `Liquidación de saldo. ${notes || ''}`.trim(),
            });
        });
        return { success: true, message: "Pago registrado exitosamente." };
    } catch (error) {
        console.error("Error al registrar el pago:", error);
        throw new HttpsError("internal", "No se pudo completar la transacción.");
    }
});


export const shipdaywebhook = onRequest(async (req, res) => {
    const secret = req.headers['x-shipday-secret'];
    if (secret !== SHIPDAY_WEBHOOK_SECRET.value()) {
        console.warn("Recibida solicitud de webhook no autorizada.");
        res.status(401).send("Unauthorized");
        return;
    }
    
    const { orderId, driverId, eventType, order } = req.body;
    if (!driverId || eventType !== 'order_delivered') {
        res.status(200).send("Evento no relevante para esta función.");
        return;
    }

    const driverQuery = await getFirestore().collection("drivers").where("shipdayId", "==", driverId).limit(1).get();
    if (driverQuery.empty) {
        console.error(`No se encontró repartidor con Shipday ID: ${driverId}`);
        res.status(404).send("Driver not found");
        return;
    }
    const driverDocRef = driverQuery.docs[0].ref;

    try {
        await getFirestore().runTransaction(async (transaction) => {
            const driverDoc = await transaction.get(driverDocRef);
            if (!driverDoc.exists) throw new Error(`Driver not found.`);

            const wallet = driverDoc.data()?.wallet || { currentBalance: 0 };
            const db = getFirestore();
            
            // Transaction for delivery fee
            if (order.paymentMethod !== 'CASH') {
                const deliveryFee = order.costing?.deliveryFee || 0;
                if(deliveryFee > 0) {
                    const creditRef = driverDocRef.collection("transactions").doc();
                    transaction.set(creditRef, {
                        date: FieldValue.serverTimestamp(),
                        type: 'credit_delivery',
                        amount: deliveryFee,
                        orderId: orderId,
                        description: `Ganancia por entrega #${orderId}`,
                    });
                    transaction.update(driverDocRef, { "wallet.currentBalance": FieldValue.increment(deliveryFee) });
                }
            } else { // CASH
                 const commission = 15.00; // Fixed commission for cash orders
                 const debitRef = driverDocRef.collection("transactions").doc();
                 transaction.set(debitRef, {
                    date: FieldValue.serverTimestamp(),
                    type: 'debit_commission',
                    amount: -commission,
                    orderId: orderId,
                    description: `Comisión por servicio en efectivo #${orderId}`,
                 });
                 transaction.update(driverDocRef, { "wallet.currentBalance": FieldValue.increment(-commission) });
            }

            // Transaction for tip
            const tip = order.costing?.tip || 0;
            if (tip > 0) {
                 const tipRef = driverDocRef.collection("transactions").doc();
                 transaction.set(tipRef, {
                    date: FieldValue.serverTimestamp(),
                    type: 'credit_tip',
                    amount: tip,
                    orderId: orderId,
                    description: `Propina recibida por pedido #${orderId}`,
                 });
                 transaction.update(driverDocRef, { "wallet.currentBalance": FieldValue.increment(tip) });
            }
        });
        res.status(200).send("Wallet updated successfully.");
    } catch (error) {
        console.error(`Error procesando webhook para pedido ${orderId}:`, error);
        res.status(500).send("Internal Server Error");
    }
});
