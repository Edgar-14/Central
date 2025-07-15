

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

    // Step 1: Create driver in Shipday
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
        })
    });

    if (!shipdayResponse.ok) {
        const errorText = await shipdayResponse.text();
        console.error("Error al crear repartidor en Shipday:", errorText);
        throw new HttpsError("internal", `Error al crear el repartidor en Shipday: ${errorText}`);
    }
    const shipdayResult = await shipdayResponse.json() as {id: number};
    
    // Step 2: Grant 'driver' role in Firebase Auth
    await getAuth().setCustomUserClaims(driverData.uid, { role: "driver" });

    // Step 3: Update Firestore document with new status and Shipday ID
    await driverDocRef.update({
        applicationStatus: "approved",
        operationalStatus: "active",
        shipdayId: shipdayResult.id,
        approvedAt: FieldValue.serverTimestamp(),
        "wallet.debtLimit": -500, // Set initial debt limit
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
            
            const driverData = driverDoc.data();
            const currentBalance = driverData?.wallet.currentBalance || 0;
            const newBalance = currentBalance - amount;

            const updates: {[key: string]: any} = { "wallet.currentBalance": newBalance };
            if (driverData?.operationalStatus === 'restricted_debt' && newBalance >= (driverData?.wallet.debtLimit || -500)) {
                updates.operationalStatus = 'active';
            }

            transaction.update(driverDocRef, updates);

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
    if (eventType !== 'order_delivered' || !driverId) {
        res.status(200).send("Evento no relevante para esta función de billetera.");
        return;
    }

    const settingsDoc = await getFirestore().collection('operationalSettings').doc('global').get();
    const settings = settingsDoc.data() || {};
    const baseCommission = settings.baseCommission || 15.00;
    const rainFee = (settings.rainFee?.active && settings.rainFee?.amount > 0) ? settings.rainFee.amount : 0;

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
            const deliveryFee = order.costing?.deliveryFee || 0;
            const tip = order.costing?.tip || 0;
            let totalCredit = 0;
            const transactionDescription: string[] = [];
            
            if (order.paymentMethod === 'CASH') {
                totalCredit = -baseCommission;
                transactionDescription.push(`Comisión (efectivo) #${orderId}`);
            } else {
                totalCredit = deliveryFee;
                transactionDescription.push(`Ganancia entrega #${orderId}`);
            }

            if (tip > 0) {
                 totalCredit += tip;
                 transactionDescription.push(`Propina: $${tip.toFixed(2)}`);
            }
            if (rainFee > 0) {
                totalCredit += rainFee;
                transactionDescription.push(`Tarifa lluvia: $${rainFee.toFixed(2)}`);
            }

            // Compensate debt if balance is negative
            if (wallet.currentBalance < 0 && totalCredit > 0) {
                const creditToDebt = Math.min(Math.abs(wallet.currentBalance), totalCredit);
                transactionDescription.push(`Abono a deuda: -$${creditToDebt.toFixed(2)}`);
            }
             
            transaction.update(driverDocRef, { "wallet.currentBalance": FieldValue.increment(totalCredit) });

            const transactionRef = driverDocRef.collection("transactions").doc();
            transaction.set(transactionRef, {
                date: FieldValue.serverTimestamp(),
                type: 'credit_delivery',
                amount: totalCredit,
                orderId: orderId,
                description: transactionDescription.join(' | '),
            });
        });
        res.status(200).send("Wallet updated successfully.");
    } catch (error) {
        console.error(`Error procesando webhook para pedido ${orderId}:`, error);
        res.status(500).send("Internal Server Error");
    }
});


export const updateOperationalSettings = onCall(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden modificar los ajustes.");
    }
    
    const settingsData = request.data;
    try {
        const settingsRef = getFirestore().collection('operationalSettings').doc('global');
        await settingsRef.set(settingsData, { merge: true });
        return { success: true, message: "Ajustes operativos actualizados." };
    } catch (error) {
        console.error("Error al guardar los ajustes operativos:", error);
        throw new HttpsError("internal", "No se pudieron guardar los ajustes.");
    }
});


// This function is intended to be triggered by a Shipday webhook for "new_order_event"
export const filterAndEnrichOrder = onRequest(async (req, res) => {
    const orderData = req.body.order; // Assuming the order data is nested under 'order'
    
    // 1. Check if the order is cash. If not, no need to filter.
    if (orderData.paymentMethod !== 'CASH') {
        res.status(200).send("Order is not cash, no filtering needed.");
        return;
    }

    // 2. Get all active drivers from Firestore
    const activeDriversQuery = getFirestore().collection('drivers').where('operationalStatus', '==', 'active');
    const activeDriversSnap = await activeDriversQuery.get();

    // 3. Filter drivers based on debt limit
    const eligibleDrivers: number[] = [];
    activeDriversSnap.forEach(doc => {
        const driver = doc.data();
        if (driver.wallet.currentBalance > driver.wallet.debtLimit && driver.shipdayId) {
            eligibleDrivers.push(driver.shipdayId);
        }
    });

    // 4. Update the order in Shipday with the eligible drivers list
    if (eligibleDrivers.length > 0) {
        // IMPORTANT: The Shipday API might not support updating an *existing* order's
        // target drivers. This step assumes it's possible via an endpoint like /orders/{orderId}.
        // If not, this logic would need to happen BEFORE the order is first sent to Shipday.
        // For this example, we assume an update is possible.
        
        const enrichedNotes = `Ganancia Estimada: $XX.XX | Método de Pago: ${orderData.paymentMethod}`;
        
        await fetch(`https://api.shipday.com/orders/${orderData.orderId}`, {
            method: 'PUT', // or 'PATCH'
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': SHIPDAY_API_KEY.value()
            },
            body: JSON.stringify({
                targetDriverIds: eligibleDrivers,
                notes: enrichedNotes 
            })
        });
        res.status(200).send(`Order ${orderData.orderId} filtered for ${eligibleDrivers.length} eligible drivers.`);
    } else {
        res.status(200).send("No eligible drivers found for this cash order.");
    }
});
