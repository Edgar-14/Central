

import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {onRequest} from "firebase-functions/v2/https";
import {defineString} from "firebase-functions/params";
import shipday from '../.api/apis/shipday';

initializeApp();

const SHIPDAY_API_KEY = defineString("SHIPDAY_API_KEY");
const SHIPDAY_WEBHOOK_SECRET = defineString("SHIPDAY_WEBHOOK_SECRET");

shipday.auth(SHIPDAY_API_KEY.value());

export const registerNewUser = onCall<{email: string, password: string, fullName: string, phone: string}>(async (request) => {
    const { email, password, fullName, phone } = request.data;
    const lowerCaseEmail = email.toLowerCase();
    
    try {
        const userRecord = await getAuth().createUser({
            email: lowerCaseEmail,
            password: password,
            displayName: fullName,
            phoneNumber: phone
        });

        const driverDocRef = getFirestore().collection("drivers").doc(lowerCaseEmail);
        await driverDocRef.set({
            uid: userRecord.uid,
            email: lowerCaseEmail,
            fullName: fullName,
            phone: phone,
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

        return { success: true, uid: userRecord.uid };

    } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
            throw new HttpsError('already-exists', 'Este correo electrónico ya está en uso.');
        }
        console.error("Error creating new user:", error);
        throw new HttpsError('internal', 'No se pudo completar el registro.');
    }
});


interface SubmitApplicationData {
    email: string;
    personalInfo: Record<string, unknown>;
    documents: Record<string, string>;
    legal: Record<string, unknown>;
}

export const submitapplication = onCall<SubmitApplicationData>((request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
    
    const docId = request.data.email?.toLowerCase();
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

    const { data: shipdayResult } = await shipday.insertDeliveryOrder({
        name: driverData.fullName, 
        email: driverData.email, 
        phoneNumber: driverData.phone 
    } as any);

    if (!shipdayResult || !(shipdayResult as any).id) {
         throw new HttpsError("internal", `Error al crear el repartidor en Shipday.`);
    }
    
    await getAuth().setCustomUserClaims(driverData.uid, { role: "driver" });

    await driverDocRef.update({
        applicationStatus: "approved",
        operationalStatus: "active",
        shipdayId: (shipdayResult as any).id,
        approvedAt: FieldValue.serverTimestamp(),
        "wallet.debtLimit": -500,
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

export const processAssignedOrder = onRequest(async (req, res) => {
    const { orderId, driverId, order } = req.body;
    
    if (!driverId || !orderId || !order) {
        res.status(400).send("Missing orderId, driverId, or order object.");
        return;
    }

    if (order.paymentMethod !== 'CASH') {
        res.status(200).send("No action needed for non-cash order.");
        return;
    }

    const driversRef = getFirestore().collection('drivers');
    const q = driversRef.where('shipdayId', '==', driverId).limit(1);
    const snapshot = await q.get();

    if (snapshot.empty) {
        console.warn(`Driver with Shipday ID ${driverId} not found in Firestore.`);
        res.status(404).send("Driver not found in our system.");
        return;
    }
    
    const driverDoc = snapshot.docs[0];
    const driverData = driverDoc.data();

    const isRestricted = driverData.operationalStatus === 'restricted_debt';
    const hasExceededDebt = driverData.wallet.currentBalance <= driverData.wallet.debtLimit;

    if (isRestricted || hasExceededDebt) {
        try {
            await shipday.unassignOrderFromDriver({ orderId: orderId.toString() });
            console.log(`Order ${orderId} successfully unassigned from driver ${driverData.fullName} due to debt.`);
            res.status(200).send("Order unassigned due to debt restriction.");
        } catch (error) {
            console.error(`Failed to unassign order ${orderId} from driver ${driverId}:`, error);
            res.status(500).send("Failed to unassign order.");
        }
    } else {
        res.status(200).send("Driver is eligible for cash order.");
    }
});

export const updateDriverWallet = onRequest(async (req, res) => {
    const secret = req.headers['x-shipday-secret'];
    if (secret !== SHIPDAY_WEBHOOK_SECRET.value()) {
        res.status(401).send("Unauthorized");
        return;
    }
    
    const { orderId, driverId, eventType, order } = req.body;
    if (eventType !== 'order_delivered' || !driverId) {
        res.status(200).send("Event not relevant for this function.");
        return;
    }

    const settingsDoc = await getFirestore().collection('operationalSettings').doc('global').get();
    const settings = settingsDoc.data() || {};
    const baseCommission = settings.baseCommission || 15.00;
    const rainFee = (settings.rainFee?.active && settings.rainFee?.amount > 0) ? settings.rainFee.amount : 0;

    const driverQuery = await getFirestore().collection("drivers").where("shipdayId", "==", driverId).limit(1).get();
    if (driverQuery.empty) {
        res.status(404).send("Driver not found");
        return;
    }
    const driverDocRef = driverQuery.docs[0].ref;

    try {
        await getFirestore().runTransaction(async (transaction) => {
            const driverDoc = await transaction.get(driverDocRef);
            if (!driverDoc.exists) throw new Error(`Driver not found.`);
            
            const driverData = driverDoc.data();
            const wallet = driverData?.wallet || { currentBalance: 0 };
            const deliveryFee = order.costing?.deliveryFee || 0;
            const tip = order.costing?.tip || 0;
            let totalCredit = 0;
            const transactionDescription: string[] = [];
            
            if (order.paymentMethod === 'CASH') {
                totalCredit = -baseCommission;
                transactionDescription.push(`Comisión (efectivo) #${orderId}`);
            } else {
                const debt = wallet.currentBalance < 0 ? Math.abs(wallet.currentBalance) : 0;
                if (debt > 0) {
                    const paymentToDebt = Math.min(debt, deliveryFee);
                    transactionDescription.push(`Abono a deuda: -$${paymentToDebt.toFixed(2)}`);
                }
                totalCredit = deliveryFee;
                transactionDescription.push(`Ganancia entrega #${orderId}`);
            }

            if (tip > 0) {
                 totalCredit += tip;
                 transactionDescription.push(`Propina: +$${tip.toFixed(2)}`);
            }
            if (rainFee > 0) {
                totalCredit += rainFee;
                transactionDescription.push(`Tarifa lluvia: +$${rainFee.toFixed(2)}`);
            }
             
            transaction.update(driverDocRef, { "wallet.currentBalance": FieldValue.increment(totalCredit) });

            const transactionRef = driverDocRef.collection("transactions").doc();
            transaction.set(transactionRef, {
                date: FieldValue.serverTimestamp(),
                type: 'credit_delivery',
                amount: totalCredit,
                orderId: orderId.toString(),
                description: transactionDescription.join(' | '),
            });
        });
        res.status(200).send("Wallet updated successfully.");
    } catch (error) {
        console.error(`Error procesando webhook para pedido ${orderId}:`, error);
        res.status(500).send("Internal Server Error");
    }
});

export const suspenddriver = onCall<{driverId: string}>(async (request) => { 
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden suspender repartidores.");
    }
    await getFirestore().collection("drivers").doc(request.data.driverId).update({ operationalStatus: "suspended" });
    return { success: true, message: "Repartidor suspendido." };
});

export const restrictdriver = onCall<{driverId: string}>(async (request) => { 
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
        throw new HttpsError("permission-denied", "Solo los administradores pueden restringir repartidores.");
    }
    await getFirestore().collection("drivers").doc(request.data.driverId).update({ operationalStatus: "restricted_debt" });
    return { success: true, message: "Repartidor restringido por deuda." };
});

export const recordPayout = onCall<{driverEmail: string, amount: number, notes?: string}>(async (request) => {
    if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
      throw new HttpsError("permission-denied", "Solo los administradores pueden registrar pagos.");
    }

    const { driverEmail, amount, notes } = request.data;
    const driverDocRef = getFirestore().collection("drivers").doc(driverEmail);
    
    try {
        await getFirestore().runTransaction(async (transaction) => {
            const driverDoc = await transaction.get(driverDocRef);
            if (!driverDoc.exists) throw new HttpsError("not-found", `No se encontró al repartidor ${driverEmail}`);
            
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
