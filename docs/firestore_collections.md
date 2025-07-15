
# Documentación de Colecciones de Firestore

Este documento describe la estructura de las colecciones utilizadas en la base de datos de Firestore para el proyecto BeFast.

## Colección: `drivers`

Esta colección almacena la información de todos los repartidores, tanto los que se registran a través de la aplicación como los que son sincronizados desde sistemas externos como Shipday.

**ID del Documento:** El correo electrónico del repartidor en minúsculas (`email.toLowerCase()`). Esto asegura que cada repartidor sea único.

### Campos del Documento

| Campo | Tipo de Dato | Descripción | Requerido | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `fullName` | `string` | Nombre completo del repartidor. | Sí | `"Ana Martinez"` |
| `email` | `string` | Correo electrónico del repartidor (en minúsculas). | Sí | `"ana.martinez@example.com"` |
| `phone` | `string` | Número de teléfono de contacto. | Sí | `"5587654321"` |
| `status` | `string` | El estado operativo actual del repartidor. | Sí | `"approved"`, `"pending"`, `"rejected"`, `"inactive"` |
| `applicationStatus` | `string` | El estado del proceso de solicitud del repartidor. | Sí | `"step1_account"`, `"step2_documents"`, `"pending_review"`, `"approved_manual_sync"` |
| `createdAt` | `timestamp` | La fecha y hora en que el documento fue creado. | Sí | `Timestamp(seconds=1678886400, nanoseconds=0)` |
| `shipdayId` | `string` | El ID único del repartidor en el sistema de Shipday. | Sí (para sincronización) | `"12345678"` |
| `personalInfo` | `map` | Objeto con información personal detallada. | Opcional | `{ "curp": "...", "rfc": "...", "nss": "...", "address": "..." }` |
| `documents` | `map` | Objeto que contiene las URLs a los documentos subidos. | Opcional | `{ "ineUrl": "https://...", "licenseUrl": "https://..." }` |
| `legal` | `map` | Información sobre los acuerdos legales aceptados. | Opcional | `{ "contractVersion": "v1.2", "signatureTimestamp": 1678886400000 }` |
| `lastSyncedFromShipday` | `timestamp` | La última vez que los datos fueron sincronizados desde Shipday (en el caso de la carga inicial). | Opcional | `Timestamp(seconds=1678886400, nanoseconds=0)` |
| `onDuty` | `boolean` | Indica si el repartidor está actualmente en servicio. Actualizado por webhooks. | Opcional | `true` |

---

## Colección: `applications`

(Esta sección se puede expandir en el futuro si se decide crear una colección separada para gestionar las solicitudes de los repartidores antes de que se conviertan en un documento en la colección `drivers`).

---
