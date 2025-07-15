
# Documentación de Colecciones de Firestore

Este documento describe la estructura de las colecciones utilizadas en la base de datos de Firestore para el proyecto BeFast.

## Colección: `drivers`

Esta colección almacena la información de todos los repartidores, tanto los que se registran a través de la aplicación como los que son sincronizados desde sistemas externos como Shipday.

**ID del Documento:** El correo electrónico del repartidor en minúsculas (`email.toLowerCase()`). Esto asegura que cada repartidor sea único.

### Campos del Documento

| Campo | Tipo de Dato | Descripción | Requerido | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `uid` | `string` | El ID único del usuario en Firebase Authentication. | Sí | `"a1b2c3d4..."` |
| `email` | `string` | Correo electrónico del repartidor (en minúsculas). | Sí | `"ana.martinez@example.com"` |
| `fullName` | `string` | Nombre completo del repartidor. | Sí | `"Ana Martinez"` |
| `phone` | `string` | Número de teléfono de contacto. | Sí | `"5587654321"` |
| `applicationStatus` | `string` | El estado del proceso de solicitud del repartidor. | Sí | `"step1_account"`, `"pending_review"`, `"approved"` |
| `operationalStatus` | `string` | El estado operativo actual del repartidor. | Sí | `"uninitialized"`, `"pending_validation"`, `"active"`, `"suspended"`, `"restricted_debt"`, `"rejected"` |
| `createdAt` | `timestamp` | La fecha y hora en que el documento fue creado. | Sí | `Timestamp(seconds=...)` |
| `applicationSubmittedAt` | `timestamp` | Fecha en que se envió la solicitud para revisión. | Opcional | `Timestamp(seconds=...)` |
| `approvedAt` | `timestamp` | Fecha en que se aprobó la solicitud. | Opcional | `Timestamp(seconds=...)` |
| `shipdayId` | `number` | El ID único del repartidor en el sistema de Shipday. | Sí (para sincronización) | `12345` |
| `personalInfo` | `map` | Objeto con información personal detallada. | Sí | `{ "curp": "...", "rfc": "...", "nss": "...", "address": "..." }` |
| `documents` | `map` | Objeto que contiene las URLs a los documentos subidos. | Sí | `{ "ineUrl": "https://...", "licenseUrl": "https://..." }` |
| `vehicleInfo` | `map` | Objeto con información del vehículo. | Sí | `{ "type": "Motocicleta", "brand": "Italika", "plate": "XYZ-123" }` |
| `legal` | `map` | Información sobre los acuerdos legales aceptados. | Sí | `{ "contractVersion": "v1.2", "signatureTimestamp": 1678886400000 }` |
| `wallet` | `map` | Contiene el estado financiero del repartidor. | Sí | `{ "currentBalance": 150.75, "debtLimit": -500 }` |
| `proStatus` | `map` | Estatus del repartidor en el programa de lealtad. | Sí | `{ "level": "Bronce", "points": 120 }` |

---

### Subcolección: `transactions`

Ubicada dentro de cada documento de `drivers`, esta subcolección almacena el historial de todos los movimientos financieros.

**ID del Documento:** Autogenerado por Firestore.

| Campo | Tipo de Dato | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- |
| `date` | `timestamp` | Fecha y hora de la transacción. | `Timestamp(seconds=...)` |
| `type` | `string` | Tipo de movimiento. | `"credit_delivery"`, `"debit_commission"`, `"payout"` |
| `amount` | `number` | Monto de la transacción (positivo para créditos, negativo para débitos). | `150.75`, `-15.00` |
| `orderId` | `string` | ID del pedido asociado a la transacción (si aplica). | `"order12345"` |
| `description` | `string` | Descripción legible de la transacción. | `"Ganancia por entrega"`, `"Comisión de servicio"` |

---

