
# BeFast Central - Arquitectura y Lógica de Funcionamiento

## 1. Objetivo del Proyecto

**BeFast Central** es una plataforma web administrativa diseñada para gestionar una flota de repartidores. Actúa como el cerebro operativo y financiero que se integra con un sistema de logística externo (Shipday) para controlar la asignación de pedidos, gestionar las finanzas de los repartidores y asegurar el cumplimiento de las reglas de negocio.

La aplicación tiene dos portales principales:
*   **Portal de Administrador:** Para la gestión de solicitudes, la supervisión de la flota, el control financiero y la configuración de variables operativas.
*   **Portal de Repartidor:** Para que los repartidores consulten su billetera, historial de transacciones, perfil y estado operativo.

---

## 2. Stack Tecnológico

*   **Framework Frontend:** Next.js con React (App Router)
*   **Lenguaje:** TypeScript
*   **Estilos:** Tailwind CSS
*   **Componentes UI:** ShadCN/UI
*   **Backend y Base de Datos:** Firebase
    *   **Autenticación:** Firebase Authentication (con roles usando Custom Claims).
    *   **Base de Datos:** Firestore (NoSQL).
    *   **Lógica de Backend:** Firebase Cloud Functions (Node.js 22).
    *   **Almacenamiento de Archivos:** Firebase Storage.
*   **Logística de Entregas:** API de Shipday (como sistema externo).

---

## 3. Lógica de Negocio Clave: Control Post-Asignación

Esta es la lógica más importante de la aplicación. BeFast **no pre-filtra** a quién le llega un pedido, sino que **reacciona inteligentemente** justo después de que Shipday asigna una orden a un repartidor.

**El Flujo es el siguiente:**

1.  **Entrada del Pedido:** Un cliente realiza un pedido en una plataforma externa (ej. un e-commerce) que está conectada directamente a Shipday.
2.  **Asignación de Shipday:** Shipday recibe la orden y la asigna al repartidor que su algoritmo considera más adecuado.
3.  **Webhook -> BeFast Actúa:** Inmediatamente después de la asignación, Shipday dispara un webhook que notifica al backend de BeFast (a la Cloud Function `processAssignedOrder`).
4.  **Verificación en Backend de BeFast:** La Cloud Function recibe el `driverId` y `orderId`. Consulta la base de datos de Firestore para verificar:
    *   El estado operativo del repartidor (ej. `active`, `restricted_debt`).
    *   El método de pago del pedido (`CASH` o `CARD`).
5.  **Decisión y Acción (El Control):**
    *   **CASO CRÍTICO:** Si el repartidor tiene un estado de **`restricted_debt`** Y el pedido es en **`CASH`**, la lógica de negocio se activa:
        *   La Cloud Function llama a la API de Shipday para **des-asignar (`unassign`) la orden** de ese repartidor.
        *   Esto evita que un repartidor con deuda acumule más efectivo de la compañía.
    *   **OTROS CASOS:** Si la condición no se cumple (el pedido es con tarjeta o el repartidor no tiene deuda), la función no hace nada y la entrega procede con normalidad.
6.  **Cierre del Ciclo (Webhook de Orden Entregada):**
    *   Cuando la entrega se completa, otro webhook de Shipday (`order_delivered`) notifica a la Cloud Function `updateDriverWallet`.
    *   Esta función calcula la ganancia (o la comisión si fue en efectivo), compensa deudas si existen y actualiza el saldo del repartidor en Firestore, dejando un registro en su historial de transacciones.

---

## 4. Modelo de Datos de Firestore

*   **`drivers` (Colección):**
    *   **ID del Documento:** El email del repartidor en minúsculas.
    *   **Campos Principales:** `uid`, `email`, `fullName`, `phone`, `shipdayId`, `applicationStatus`, `operationalStatus`.
    *   **Objetos Anidados:** `personalInfo`, `vehicleInfo`, `documents`, `legal`.
    *   **`wallet` (Objeto):** Contiene `currentBalance` (puede ser negativo) y `debtLimit`.
    *   **`transactions` (Subcolección):** Dentro de cada documento de repartidor. Almacena el historial de todos los movimientos financieros (ganancias, comisiones, pagos, etc.).

*   **`operationalSettings` (Colección):**
    *   **ID del Documento:** `global`.
    *   **Contenido:** Un único documento que almacena variables operativas que los administradores pueden cambiar en tiempo real.
    *   **Campos:** `baseCommission` (comisión por pedido en efectivo), `rainFee` (con estado `active` y `amount`), `incentives` (un array de objetos con descripción, monto y estado).

---

## 5. Flujos de Usuario Principales

### Administrador (`/admin/*`)

*   **Revisa Solicitudes:** Aprueba o rechaza nuevas solicitudes de repartidores.
*   **Gestiona Flota:** Ve la lista de todos los repartidores, su estado operativo y su saldo.
*   **Toma Acciones:** Puede suspender o restringir a un repartidor por deuda.
*   **Registra Pagos:** Utiliza un modal para registrar liquidaciones de saldo a los repartidores, lo que invoca la Cloud Function `recordPayout`.
*   **Configura la Operación:** Modifica las tarifas, comisiones e incentivos desde el panel de "Ajustes Operativos".
*   **Sincronización Manual:** Puede registrar en Firestore a repartidores que ya existían en Shipday.

### Repartidor (`/driver/*`)

*   **Consulta su Billetera:** Ve su saldo en tiempo real, su límite de deuda y su historial completo de transacciones.
*   **Ve Incentivos:** Se le informa de las bonificaciones y tarifas especiales que están activas.
*   **Consulta su Perfil:** Puede ver toda su información personal, de vehículo y legal.
