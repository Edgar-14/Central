import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onRequest } from "firebase-functions/v2/https";
import { beforeUserCreated } from "firebase-functions/v2/identity";
import { defineString } from "firebase-functions/params";
import * as logger from "firebase-functions/logger";
import fetch from "node-fetch";

// --- Inicialización ---
initializeApp();
const db = getFirestore();
const auth = getAuth();

// --- Variables de Entorno (Secrets) ---
const SHIPDAY_API_KEY = defineString("SHIPDAY_API_KEY");
const SHIPDAY_WEBHOOK_SECRET = defineString("SHIPDAY_WEBHOOK_SECRET");

// --- 1. Gatillo de Creación de Usuario ---
export const setupnewuser = beforeUserCreated(async (event) => {
  const user = event.data;
  if (!user) {
    logger.error("setupnewuser fue llamado sin datos de usuario.");
    throw new HttpsError("internal", "No se proporcionaron datos de usuario para la creación.");
  }
  const driverDocRef = db.collection("drivers").doc(user.uid);
  try {
    await driverDocRef.set({
      uid: user.uid,
      personalInfo: {
        email: user.email || "",
        fullName: user.displayName || "",
        phone: user.phoneNumber || "",
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
    logger.info(`Documento inicial creado para el conductor: ${user.uid}`);
  } catch (error) {
    logger.error(`Error al crear documento para ${user.uid}:`, error);
    throw new HttpsError("internal", "No se pudo inicializar el perfil del conductor.");
  }
});

// --- 2. Funciones del Conductor ---
export const submitapplication = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "La función debe ser llamada por un usuario autenticado.");
  }
  const { personalInfo, documents, legal } = request.data;
  if (!personalInfo || !documents || !legal) {
    throw new HttpsError("invalid-argument", "Faltan datos en la solicitud. Se requiere: personalInfo, documents y legal.");
  }
  const { uid } = request.auth.token;
  const driverDocRef = db.collection("drivers").doc(uid);
  try {
    await driverDocRef.update({
      personalInfo,
      documents,
      legal,
      operationalStatus: "pending_validation",
      applicationSubmittedAt: FieldValue.serverTimestamp(),
    });
    logger.info(`Solicitud recibida y actualizada para el conductor: ${uid}`);
    return { success: true, message: "Solicitud enviada con éxito." };
  } catch (error) {
    logger.error(`Error al enviar la solicitud para ${uid}:`, error);
    throw new HttpsError("internal", "Ocurrió un error al guardar tu solicitud.");
  }
});

// --- 3. Funciones de Administrador ---
export const activatedriver = onCall(async (request) => {
  if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
    throw new HttpsError("permission-denied", "Solo los administradores pueden activar repartidores.");
  }
  const { driverId } = request.data;
  if (!driverId) {
    throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'driverId'.");
  }
  const driverDocRef = db.collection("drivers").doc(driverId);
  try {
    const driverDoc = await driverDocRef.get();
    if (!driverDoc.exists) {
      throw new HttpsError("not-found", `No se encontró el repartidor con ID: ${driverId}`);
    }
    const driverData = driverDoc.data();
    const shipdayResponse = await fetch("https://api.shipday.com/driver/add", {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Basic ${SHIPDAY_API_KEY.value()}`
      },
      body: JSON.stringify({
        name: driverData?.personalInfo.fullName,
        email: driverData?.personalInfo.email,
        phoneNumber: driverData?.personalInfo.phone,
      })
    });
    if (!shipdayResponse.ok) {
      const errorText = await shipdayResponse.text();
      throw new HttpsError("internal", `Error al crear el repartidor en Shipday: ${errorText}`);
    }
    const shipdayResult = await shipdayResponse.json() as { id: number };
    await auth.setCustomUserClaims(driverId, { role: "driver" });
    await driverDocRef.update({
      operationalStatus: "active",
      shipdayId: shipdayResult.id,
    });
    logger.info(`Repartidor ${driverId} activado con éxito. Shipday ID: ${shipdayResult.id}`);
    return { success: true, message: "Repartidor activado con éxito." };
  } catch (error) {
    logger.error(`Error al activar al repartidor ${driverId}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError("internal", "Ocurrió un error en el servidor al activar el repartidor.");
  }
});

export const rejectapplication = onCall(async (request) => {
  if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
    throw new HttpsError("permission-denied", "Solo los administradores pueden rechazar solicitudes.");
  }
  const { driverId } = request.data;
  if (!driverId) {
    throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'driverId'.");
  }
  try {
    await db.collection("drivers").doc(driverId).update({ operationalStatus: "rejected" });
    logger.info(`Solicitud del repartidor ${driverId} rechazada.`);
    return { success: true, message: "Solicitud rechazada." };
  } catch (error) {
    logger.error(`Error al rechazar al repartidor ${driverId}:`, error);
    throw new HttpsError("internal", "Ocurrió un error al rechazar la solicitud.");
  }
});

export const suspenddriver = onCall(async (request) => {
  if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
    throw new HttpsError("permission-denied", "Solo los administradores pueden suspender repartidores.");
  }
  const { driverId } = request.data;
  if (!driverId) {
    throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'driverId'.");
  }
  try {
    await db.collection("drivers").doc(driverId).update({ operationalStatus: "suspended" });
    logger.info(`Repartidor ${driverId} suspendido.`);
    return { success: true, message: "Repartidor suspendido." };
  } catch(error) {
    logger.error(`Error al suspender al repartidor ${driverId}:`, error);
    throw new HttpsError("internal", "Ocurrió un error al suspender al repartidor.");
  }
});

export const restrictdriver = onCall(async (request) => {
  if (request.auth?.token.role !== "admin" && request.auth?.token.role !== 'superadmin') {
    throw new HttpsError("permission-denied", "Solo los administradores pueden restringir repartidores.");
  }
  const { driverId } = request.data;
  if (!driverId) {
    throw new HttpsError("invalid-argument", "La función debe ser llamada con un 'driverId'.");
  }
  try {
    await db.collection("drivers").doc(driverId).update({ operationalStatus: "restricted_debt" });
    logger.info(`Repartidor ${driverId} restringido por deuda.`);
    return { success: true, message: "Repartidor restringido por deuda." };
  } catch(error) {
    logger.error(`Error al restringir al repartidor ${driverId}:`, error);
    throw new HttpsError("internal", "Ocurrió un error al restringir al repartidor.");
  }
});


// --- 4. Webhooks y Procesamiento de Órdenes ---
export const processneworder = onRequest(async (req, res) => {
  try {
    const orderData = req.body;
    const { paymentMethod } = orderData;
    const availableDriversResponse = await fetch("https://api.shipday.com/v1/drivers/list", {
      method: 'GET',
      headers: { 'Authorization': `Basic ${SHIPDAY_API_KEY.value()}` }
    });
    const availableDrivers = (await availableDriversResponse.json() as { drivers: { id: number }[] }).drivers;
    const driverShipdayIds = availableDrivers.map((d) => d.id);
    
    if (driverShipdayIds.length === 0) {
      logger.info("processneworder: No hay repartidores disponibles en Shipday.");
      res.status(200).send("No hay repartidores disponibles en Shipday.");
      return;
    }

    const driverDocs = await db.collection('drivers').where('shipdayId', 'in', driverShipdayIds).get();
    const eligibleDriverIds = [];
    for (const doc of driverDocs.docs) {
      const driver = doc.data();
      if (driver.operationalStatus !== 'active') continue;
      if (paymentMethod === 'cash' && driver.wallet.currentBalance <= driver.wallet.debtLimit) continue;
      eligibleDriverIds.push(driver.shipdayId);
    }

    if (eligibleDriverIds.length === 0) {
        logger.info("processneworder: Ningún repartidor cumplió los filtros de elegibilidad.");
        res.status(200).send("No se encontraron repartidores elegibles.");
        return;
    }
    
    await fetch("https://api.shipday.com/v1/orders", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${SHIPDAY_API_KEY.value()}`
      },
      body: JSON.stringify({
        ...orderData,
        targetDriverIds: eligibleDriverIds,
      })
    });
    res.status(200).send("Pedido procesado y enviado a repartidores elegibles.");
  } catch (error) {
    logger.error("Error en processneworder:", error);
    res.status(500).send("Error interno del servidor al procesar la orden.");
  }
});

export const shipdaywebhook = onRequest(async (req, res) => {
  const secret = req.headers['x-shipday-secret'];
  if (secret !== SHIPDAY_WEBHOOK_SECRET.value()) {
    logger.warn("Recibida solicitud de webhook no autorizada.");
    res.status(401).send("No autorizado");
    return;
  }
  const { orderId, driverId, eventType, order } = req.body;
  if (!driverId || !orderId || !eventType) {
    res.status(400).send("Faltan campos obligatorios.");
    return;
  }
  if (eventType !== 'order_delivered') {
    res.status(200).send("Evento no relevante para el procesamiento de la billetera.");
    return;
  }
  
  // NOTA: El 'driverId' del webhook de Shipday es el 'shipdayId' en nuestra base de datos.
  const driversQuery = db.collection("drivers").where("shipdayId", "==", driverId).limit(1);

  try {
    const driverSnapshot = await driversQuery.get();
    if (driverSnapshot.empty) {
        throw new Error(`Repartidor con Shipday ID ${driverId} no encontrado en Firestore.`);
    }
    const driverDocRef = driverSnapshot.docs[0].ref;

    await db.runTransaction(async (transaction) => {
      const driverDoc = await transaction.get(driverDocRef);
      if (!driverDoc.exists) {
        throw new Error(`El documento del repartidor no existe.`);
      }
      const driverData = driverDoc.data();
      if (!driverData) {
        throw new Error("No hay datos en el documento del repartidor.");
      }

      const deliveryFee = order?.deliveryFee || 0;
      const tip = order?.tip || 0;
      const commissionRate = 0.20; // 20% de comisión. Considera mover a operationalSettings.
      const commission = deliveryFee * commissionRate;
      const totalCredit = deliveryFee + tip;
      const newBalance = (driverData.wallet.currentBalance || 0) + totalCredit - commission;
      
      transaction.update(driverDocRef, { "wallet.currentBalance": newBalance });

      const creditTransactionRef = driverDocRef.collection("transactions").doc();
      transaction.set(creditTransactionRef, {
        date: FieldValue.serverTimestamp(),
        type: 'credit_delivery',
        amount: totalCredit,
        orderId,
        description: `Entrega completada: +${totalCredit.toFixed(2)}`,
      });

      const commissionTransactionRef = driverDocRef.collection("transactions").doc();
      transaction.set(commissionTransactionRef, {
        date: FieldValue.serverTimestamp(),
        type: 'debit_commission',
        amount: -commission,
        orderId,
        description: `Comisión de servicio: -${commission.toFixed(2)}`,
      });
    });

    res.status(200).send("Billetera actualizada correctamente.");
  } catch (error) {
    logger.error(`Error procesando webhook para orden ${orderId}:`, error);
    res.status(500).send("Error interno del servidor");
  }
});