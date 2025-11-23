import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Package, ShoppingCart, TrendingUp, Brain } from "lucide-react";

export default function Wiki() {
  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Wiki - Base de Conocimiento</h1>
            <p className="text-muted-foreground">
              Documentación de procedimientos y diagramas de proceso
            </p>
          </div>
        </div>

        <Tabs defaultValue="pedidos" className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
            <TabsTrigger value="pedidos" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="compras" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">Compras</span>
            </TabsTrigger>
            <TabsTrigger value="reorden" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Reorden IA</span>
            </TabsTrigger>
            <TabsTrigger value="prediccion" className="gap-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Predicción IA</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pedidos" className="space-y-6 mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Gestión de Pedidos & Cross-Docking</h2>
              
              <div className="prose max-w-none dark:prose-invert">
                <h3>Descripción General</h3>
                <p>
                  El módulo de Gestión de Pedidos maneja el ciclo completo de los pedidos de clientes,
                  desde la recepción hasta la entrega, incluyendo operaciones de cross-docking para
                  optimizar el flujo de mercancías.
                </p>

                <h3>SOP: Procesamiento de Pedidos</h3>
                
                <h4>1. Recepción del Pedido</h4>
                <ul>
                  <li><strong>Actor:</strong> Cliente / Sistema</li>
                  <li><strong>Ubicación:</strong> Página principal o formulario de pedido</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>El cliente selecciona productos del catálogo</li>
                      <li>Completa información de contacto y entrega</li>
                      <li>Confirma el pedido</li>
                      <li>El sistema genera un número de orden único</li>
                      <li>Se crea registro en <code>sales_orders</code> y <code>sales_order_items</code></li>
                      <li>Estado inicial: <code>UNFULFILLED</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Pedido creado con estado UNFULFILLED</li>
                </ul>

                <h4>2. Verificación de Inventario</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema / Administrador</li>
                  <li><strong>Ubicación:</strong> /admin/pedidos</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>El sistema verifica disponibilidad en tabla <code>products</code></li>
                      <li>Si stock suficiente: marca como listo para picking</li>
                      <li>Si stock insuficiente:
                        <ul>
                          <li>Marca item como backorder (<code>is_backorder = true</code>)</li>
                          <li>Cambia estado a <code>WAITING_STOCK</code></li>
                          <li>Puede generar automáticamente PO de reabastecimiento</li>
                        </ul>
                      </li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Estado actualizado según disponibilidad</li>
                </ul>

                <h4>3. Proceso de Picking</h4>
                <ul>
                  <li><strong>Actor:</strong> Operador de Almacén</li>
                  <li><strong>Ubicación:</strong> /admin/pedidos (filtro Unfulfilled)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Accede al detalle del pedido</li>
                      <li>Hace clic en "Iniciar Picking"</li>
                      <li>Sistema actualiza <code>picking_started_at = NOW()</code></li>
                      <li>Estado cambia a <code>PICKING</code></li>
                      <li>Operador recoge items del almacén</li>
                      <li>Verifica cantidades y condiciones</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Items recolectados, listo para empaque</li>
                </ul>

                <h4>4. Empaque del Pedido</h4>
                <ul>
                  <li><strong>Actor:</strong> Operador de Empaque</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Recibe items del picking</li>
                      <li>Embala productos según estándares</li>
                      <li>Genera etiqueta de envío</li>
                      <li>Hace clic en "Marcar como Empacado"</li>
                      <li>Sistema actualiza <code>packed_at = NOW()</code></li>
                      <li>Estado cambia a <code>PACKED</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Pedido empacado y etiquetado</li>
                </ul>

                <h4>5. Envío del Pedido</h4>
                <ul>
                  <li><strong>Actor:</strong> Coordinador de Envíos</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Selecciona courier en el detalle del pedido</li>
                      <li>Ingresa número de tracking</li>
                      <li>Hace clic en "Marcar como Enviado"</li>
                      <li>Sistema actualiza <code>shipped_at = NOW()</code></li>
                      <li>Estado cambia a <code>SHIPPED</code></li>
                      <li>Sistema envía notificación al cliente con tracking</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Pedido en tránsito, cliente notificado</li>
                </ul>

                <h4>6. Entrega Final</h4>
                <ul>
                  <li><strong>Actor:</strong> Courier / Sistema</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Courier entrega el pedido al cliente</li>
                      <li>Sistema o administrador actualiza estado</li>
                      <li>Hace clic en "Marcar como Entregado"</li>
                      <li>Sistema actualiza <code>delivered_at = NOW()</code></li>
                      <li>Estado cambia a <code>DELIVERED</code></li>
                      <li>Se registra en <code>order_state_log</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Pedido completado exitosamente</li>
                </ul>

                <h3>Cross-Docking</h3>
                <p>
                  El sistema identifica automáticamente oportunidades de cross-docking cuando:
                </p>
                <ul>
                  <li>Un pedido de cliente requiere items sin stock</li>
                  <li>Existe una orden de compra en tránsito con esos items</li>
                  <li>Las fechas de entrega coinciden</li>
                </ul>
                <p>
                  El <code>CrossDockingTracker</code> muestra estas conexiones y permite coordinar
                  el flujo directo desde recepción a envío sin almacenamiento intermedio.
                </p>

                <h3>Diagrama de Proceso - Flujo de Pedido</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`graph TD
    A[Cliente Crea Pedido] --> B{¿Stock Disponible?}
    B -->|Sí| C[Estado: UNFULFILLED]
    B -->|No| D[Marcar Backorder]
    D --> E[Estado: WAITING_STOCK]
    E --> F[Generar PO Automática]
    F --> G[Esperar Recepción PO]
    G --> C
    C --> H[Operador: Iniciar Picking]
    H --> I[Estado: PICKING]
    I --> J[Recolectar Items]
    J --> K[Empacar Pedido]
    K --> L[Estado: PACKED]
    L --> M[Asignar Courier + Tracking]
    M --> N[Estado: SHIPPED]
    N --> O[Notificar Cliente]
    O --> P[Courier Entrega]
    P --> Q[Estado: DELIVERED]
    Q --> R[Pedido Completado]

    style A fill:#e3f2fd
    style D fill:#fff3e0
    style E fill:#fff3e0
    style F fill:#fff3e0
    style Q fill:#e8f5e9
    style R fill:#e8f5e9`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Diagrama de Secuencia - Interacciones entre Módulos</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`sequenceDiagram
    participant C as Cliente
    participant SO as Sales Orders
    participant INV as Inventory
    participant PO as Purchase Orders
    participant WH as Warehouse
    participant NOT as Notifications

    C->>SO: Crear Pedido
    SO->>INV: Verificar Stock
    alt Stock Disponible
        INV-->>SO: Stock OK
        SO->>WH: Asignar a Picking
    else Sin Stock
        INV-->>SO: Stock Insuficiente
        SO->>PO: Crear PO Automática
        PO->>INV: Actualizar al Recibir
        INV->>SO: Notificar Stock Disponible
        SO->>WH: Asignar a Picking
    end
    WH->>SO: Actualizar Estados (Picking→Packed→Shipped)
    SO->>NOT: Enviar Notificación Cliente
    NOT->>C: Email con Tracking
    WH->>SO: Marcar como Entregado
    SO->>INV: Actualizar Estadísticas`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Estados del Pedido</h3>
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Descripción</th>
                      <th>Acciones Disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>UNFULFILLED</code></td>
                      <td>Pedido recibido, pendiente de procesamiento</td>
                      <td>Iniciar Picking, Cancelar</td>
                    </tr>
                    <tr>
                      <td><code>WAITING_STOCK</code></td>
                      <td>Esperando reabastecimiento de inventario</td>
                      <td>Ver PO Vinculada, Notificar Cliente</td>
                    </tr>
                    <tr>
                      <td><code>PICKING</code></td>
                      <td>En proceso de recolección de items</td>
                      <td>Marcar como Empacado</td>
                    </tr>
                    <tr>
                      <td><code>PACKED</code></td>
                      <td>Empacado, listo para envío</td>
                      <td>Asignar Courier, Marcar como Enviado</td>
                    </tr>
                    <tr>
                      <td><code>SHIPPED</code></td>
                      <td>En tránsito al cliente</td>
                      <td>Actualizar Tracking, Marcar como Entregado</td>
                    </tr>
                    <tr>
                      <td><code>DELIVERED</code></td>
                      <td>Entregado al cliente</td>
                      <td>Ver Historial, Generar Reporte</td>
                    </tr>
                    <tr>
                      <td><code>PARTIAL</code></td>
                      <td>Entrega parcial (algunos items en backorder)</td>
                      <td>Ver Items Pendientes, Completar Entrega</td>
                    </tr>
                  </tbody>
                </table>

                <h3>Roles y Permisos</h3>
                <ul>
                  <li><strong>Cliente:</strong> Crear pedidos, ver seguimiento</li>
                  <li><strong>Operador de Almacén:</strong> Picking, empaque, actualizar estados</li>
                  <li><strong>Coordinador de Envíos:</strong> Asignar courier, gestionar tracking</li>
                  <li><strong>Administrador:</strong> Acceso completo, gestión de excepciones</li>
                </ul>

                <h3>Integraciones</h3>
                <ul>
                  <li><strong>Inventory Management:</strong> Verificación y descuento de stock</li>
                  <li><strong>Purchase Orders:</strong> Generación automática de POs para backorders</li>
                  <li><strong>Notifications:</strong> Alertas por email (Resend) en cada cambio de estado</li>
                  <li><strong>Analytics:</strong> Registro de métricas de rendimiento</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="compras" className="space-y-6 mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Órdenes de Compra & Cross-Docking</h2>
              
              <div className="prose max-w-none dark:prose-invert">
                <h3>Descripción General</h3>
                <p>
                  El módulo de Órdenes de Compra gestiona el aprovisionamiento de inventario desde
                  proveedores, incluyendo operaciones de cross-docking para fulfillment directo.
                </p>

                <h3>SOP: Gestión de Órdenes de Compra</h3>
                
                <h4>1. Creación de Orden de Compra</h4>
                <ul>
                  <li><strong>Actor:</strong> Comprador / Sistema IA</li>
                  <li><strong>Ubicación:</strong> /admin/ordenes-compra</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Hace clic en "Nueva Orden de Compra"</li>
                      <li>Selecciona tipo de orden:
                        <ul>
                          <li><code>STOCK_REPLENISHMENT</code>: Reabastecimiento normal</li>
                          <li><code>BACKORDER_FULFILLMENT</code>: Para completar pedidos pendientes</li>
                          <li><code>CROSS_DOCKING</code>: Flujo directo sin almacenamiento</li>
                        </ul>
                      </li>
                      <li>Selecciona proveedor de tabla <code>suppliers</code></li>
                      <li>Añade productos y cantidades</li>
                      <li>Define prioridad: NORMAL, HIGH, URGENT</li>
                      <li>Establece fecha esperada de entrega</li>
                      <li>Añade notas y condiciones de pago</li>
                      <li>Sistema genera número de PO secuencial</li>
                      <li>Guarda con estado <code>DRAFT</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> PO creada en estado DRAFT</li>
                </ul>

                <h4>2. Revisión y Aprobación</h4>
                <ul>
                  <li><strong>Actor:</strong> Gerente de Compras</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Revisa detalles de la PO</li>
                      <li>Verifica precios y condiciones</li>
                      <li>Valida disponibilidad del proveedor</li>
                      <li>Hace clic en "Aprobar"</li>
                      <li>Sistema actualiza <code>approved_by = user_id</code></li>
                      <li>Estado cambia a <code>APPROVED</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> PO aprobada, lista para enviar</li>
                </ul>

                <h4>3. Envío al Proveedor</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema / Comprador</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Hace clic en "Enviar al Proveedor"</li>
                      <li>Sistema genera documento PDF de la PO</li>
                      <li>Envía email al proveedor con detalles</li>
                      <li>Estado cambia a <code>SENT</code></li>
                      <li>Se registra timestamp de envío</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Proveedor notificado, PO en proceso</li>
                </ul>

                <h4>4. Confirmación del Proveedor</h4>
                <ul>
                  <li><strong>Actor:</strong> Proveedor / Comprador</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Proveedor confirma recepción y capacidad</li>
                      <li>Comprador actualiza estado a <code>CONFIRMED</code></li>
                      <li>Ingresa número de referencia del proveedor</li>
                      <li>Actualiza fecha de entrega confirmada</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> PO confirmada con fecha de entrega</li>
                </ul>

                <h4>5. En Tránsito</h4>
                <ul>
                  <li><strong>Actor:</strong> Proveedor / Sistema</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Proveedor notifica que envió la mercancía</li>
                      <li>Comprador actualiza estado a <code>IN_TRANSIT</code></li>
                      <li>Ingresa número de tracking</li>
                      <li>Sistema puede consultar APIs de transporte</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> PO en tránsito, rastreable</li>
                </ul>

                <h4>6. Recepción en Almacén</h4>
                <ul>
                  <li><strong>Actor:</strong> Operador de Recepción</li>
                  <li><strong>Ubicación:</strong> /admin/ordenes-compra (filtro In Transit)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Verifica llegada de mercancía</li>
                      <li>Inspecciona condiciones y cantidades</li>
                      <li>Opción 1 - Recepción Total:
                        <ul>
                          <li>Hace clic en "Recibir Completo"</li>
                          <li>Sistema ejecuta <code>process_purchase_order_received()</code></li>
                          <li>Actualiza stock en tabla <code>products</code></li>
                          <li>Estado cambia a <code>RECEIVED</code></li>
                        </ul>
                      </li>
                      <li>Opción 2 - Recepción Parcial:
                        <ul>
                          <li>Ingresa cantidades recibidas por item</li>
                          <li>Actualiza <code>qty_received</code> en <code>purchase_order_items</code></li>
                          <li>Estado cambia a <code>PARTIAL_RECEIVED</code></li>
                          <li>Coordina entrega pendiente con proveedor</li>
                        </ul>
                      </li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Stock actualizado, PO recibida</li>
                </ul>

                <h4>7. Cross-Docking (Flujo Alternativo)</h4>
                <ul>
                  <li><strong>Condición:</strong> PO vinculada a Sales Order</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Mercancía llega al dock de recepción</li>
                      <li>En lugar de almacenar, se redirige a dock de envío</li>
                      <li>Sistema identifica pedido vinculado en <code>linked_sales_order_id</code></li>
                      <li>Actualiza ambos estados simultáneamente:
                        <ul>
                          <li>PO → <code>RECEIVED</code></li>
                          <li>Sales Order → <code>PICKING</code> o <code>PACKED</code></li>
                        </ul>
                      </li>
                      <li>Minimiza tiempo de almacenamiento</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Fulfillment optimizado, reducción de costos</li>
                </ul>

                <h4>8. Pago al Proveedor</h4>
                <ul>
                  <li><strong>Actor:</strong> Contador / Finanzas</li>
                  <li><strong>Ubicación:</strong> /admin/pagos</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Revisa facturas pendientes en <code>v_purchase_orders_payment_summary</code></li>
                      <li>Verifica términos de pago (<code>payment_terms</code>)</li>
                      <li>Procesa pago según método acordado</li>
                      <li>Actualiza <code>payment_status</code>:
                        <ul>
                          <li><code>PENDING</code> → <code>PARTIAL_PAID</code> (anticipo)</li>
                          <li><code>PARTIAL_PAID</code> → <code>PAID</code> (completo)</li>
                        </ul>
                      </li>
                      <li>Registra monto pagado en <code>advance_payment_amount</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Obligación financiera cumplida</li>
                </ul>

                <h3>Diagrama de Proceso - Flujo de Orden de Compra</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`graph TD
    A[Detectar Necesidad Reabastecimiento] --> B{¿Creación Automática?}
    B -->|Sí - IA| C[Sistema Crea PO Borrador]
    B -->|No - Manual| D[Comprador Crea PO]
    C --> E[Estado: DRAFT]
    D --> E
    E --> F[Gerente Revisa PO]
    F --> G{¿Aprobar?}
    G -->|No| H[Rechazar / Modificar]
    H --> E
    G -->|Sí| I[Estado: APPROVED]
    I --> J[Enviar a Proveedor]
    J --> K[Estado: SENT]
    K --> L[Proveedor Confirma]
    L --> M[Estado: CONFIRMED]
    M --> N[Proveedor Envía]
    N --> O[Estado: IN_TRANSIT]
    O --> P{¿Es Cross-Docking?}
    P -->|Sí| Q[Dock de Recepción]
    Q --> R[Verificar y Redirigir]
    R --> S[Dock de Envío Directo]
    S --> T[Actualizar SO vinculada]
    T --> U[Estado: RECEIVED]
    P -->|No| V[Recepción Normal]
    V --> W[Inspección y Conteo]
    W --> X{¿Recepción Completa?}
    X -->|Sí| Y[Actualizar Stock Completo]
    X -->|No| Z[Recepción Parcial]
    Z --> AA[Actualizar Stock Parcial]
    Z --> AB[Coordinar Faltantes]
    Y --> U
    AA --> AC[Estado: PARTIAL_RECEIVED]
    U --> AD[Programar Pago]
    AD --> AE[Estado: CLOSED]

    style A fill:#e3f2fd
    style C fill:#fff3e0
    style I fill:#e8f5e9
    style Q fill:#ffe0b2
    style S fill:#ffe0b2
    style U fill:#e8f5e9
    style AE fill:#e0e0e0`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Diagrama de Secuencia - Cross-Docking</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`sequenceDiagram
    participant SO as Sales Order
    participant INV as Inventory
    participant PO as Purchase Order
    participant SUP as Supplier
    participant RD as Reception Dock
    participant SD as Shipping Dock

    SO->>INV: Verificar Stock Item
    INV-->>SO: Sin Stock
    SO->>PO: Crear PO (Type: CROSS_DOCKING)
    PO->>PO: Vincular linked_sales_order_id
    PO->>SUP: Enviar PO Urgente
    SUP->>PO: Confirmar Entrega
    SUP->>RD: Enviar Mercancía
    RD->>RD: Verificar contra PO
    RD->>SD: Transferir Directo (no almacenar)
    SD->>SO: Items Disponibles
    SO->>SO: Actualizar a PICKING/PACKED
    SD->>PO: Confirmar Recepción
    PO->>INV: Actualizar Stock (opcional mínimo)
    PO->>PO: Estado: RECEIVED
    SO->>SO: Continuar Fulfillment Normal`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Estados de Orden de Compra</h3>
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>Estado</th>
                      <th>Descripción</th>
                      <th>Acciones Disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>DRAFT</code></td>
                      <td>Borrador, pendiente de revisión</td>
                      <td>Editar, Eliminar, Enviar a Aprobación</td>
                    </tr>
                    <tr>
                      <td><code>APPROVED</code></td>
                      <td>Aprobada por gerencia</td>
                      <td>Enviar a Proveedor, Cancelar</td>
                    </tr>
                    <tr>
                      <td><code>SENT</code></td>
                      <td>Enviada al proveedor</td>
                      <td>Marcar como Confirmada, Seguimiento</td>
                    </tr>
                    <tr>
                      <td><code>CONFIRMED</code></td>
                      <td>Confirmada por proveedor</td>
                      <td>Actualizar Fecha, Esperar Envío</td>
                    </tr>
                    <tr>
                      <td><code>IN_TRANSIT</code></td>
                      <td>En camino al almacén</td>
                      <td>Rastrear, Preparar Recepción</td>
                    </tr>
                    <tr>
                      <td><code>PARTIAL_RECEIVED</code></td>
                      <td>Recepción parcial de items</td>
                      <td>Recibir Faltantes, Ver Progreso</td>
                    </tr>
                    <tr>
                      <td><code>RECEIVED</code></td>
                      <td>Recibida completamente</td>
                      <td>Procesar Pago, Cerrar</td>
                    </tr>
                    <tr>
                      <td><code>CLOSED</code></td>
                      <td>Cerrada y archivada</td>
                      <td>Ver Historial, Duplicar</td>
                    </tr>
                  </tbody>
                </table>

                <h3>Tipos de Órdenes de Compra</h3>
                <ul>
                  <li><strong>STOCK_REPLENISHMENT:</strong> Reposición normal de inventario basada en niveles de reorden</li>
                  <li><strong>BACKORDER_FULFILLMENT:</strong> Para completar pedidos de clientes pendientes</li>
                  <li><strong>CROSS_DOCKING:</strong> Flujo directo sin almacenamiento intermedio</li>
                  <li><strong>EMERGENCY:</strong> Reabastecimiento urgente con prioridad alta</li>
                </ul>

                <h3>Métricas de Rendimiento</h3>
                <ul>
                  <li><strong>Lead Time Real:</strong> Días desde creación hasta recepción</li>
                  <li><strong>Fill Rate:</strong> % de items recibidos vs ordenados</li>
                  <li><strong>On-Time Delivery:</strong> % de POs recibidas en fecha esperada</li>
                  <li><strong>Cross-Dock Rate:</strong> % de POs procesadas sin almacenamiento</li>
                  <li><strong>Supplier Performance:</strong> Rating basado en cumplimiento</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reorden" className="space-y-6 mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Punto de Reorden IA - Calculadora Inteligente</h2>
              
              <div className="prose max-w-none dark:prose-invert">
                <h3>Descripción General</h3>
                <p>
                  El módulo de Punto de Reorden IA utiliza algoritmos de machine learning para calcular
                  puntos de reorden óptimos basados en patrones de demanda, estacionalidad y lead times
                  de proveedores.
                </p>

                <h3>SOP: Cálculo de Punto de Reorden</h3>
                
                <h4>1. Recopilación de Datos</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema (Automático)</li>
                  <li><strong>Frecuencia:</strong> Diario (00:00 hrs)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Ejecuta <code>calculate_reorder_points()</code> desde edge function</li>
                      <li>Extrae datos históricos de ventas (últimos 90 días):
                        <ul>
                          <li>Tabla <code>orders</code> y <code>sales_orders</code></li>
                          <li>Calcula demanda diaria promedio</li>
                          <li>Identifica picos y tendencias</li>
                        </ul>
                      </li>
                      <li>Obtiene lead times de proveedores:
                        <ul>
                          <li>Tabla <code>suppliers</code> → <code>lead_time_days</code></li>
                          <li>Tabla <code>products</code> → <code>lead_time_days_override</code></li>
                        </ul>
                      </li>
                      <li>Analiza variabilidad de demanda (desviación estándar)</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Dataset preparado para cálculo</li>
                </ul>

                <h4>2. Cálculo del Punto de Reorden</h4>
                <ul>
                  <li><strong>Fórmula Base:</strong></li>
                </ul>
                <pre className="bg-muted p-4 rounded">
ROP = (Demanda Diaria Promedio × Lead Time) + Safety Stock

Safety Stock = Z-score × σ × √Lead Time

Donde:
- Demanda Diaria Promedio = Total Ventas / Días
- Lead Time = Días de entrega del proveedor
- Z-score = Factor de servicio deseado (95% = 1.65, 99% = 2.33)
- σ = Desviación estándar de la demanda
                </pre>

                <ul>
                  <li><strong>Pasos del Algoritmo:</strong>
                    <ol>
                      <li>Calcula demanda diaria promedio por producto</li>
                      <li>Calcula desviación estándar de demanda</li>
                      <li>Determina lead time efectivo (proveedor + buffer)</li>
                      <li>Calcula safety stock con Z-score 1.65 (95% servicio)</li>
                      <li>Suma componentes para ROP final</li>
                      <li>Aplica ajustes estacionales si aplica</li>
                      <li>Guarda en <code>products.ai_reorder_point</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> ROP calculado y almacenado</li>
                </ul>

                <h4>3. Simulación de Escenarios</h4>
                <ul>
                  <li><strong>Actor:</strong> Planificador de Inventario</li>
                  <li><strong>Ubicación:</strong> /admin/punto-reorden-ia (ROPSimulator)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Selecciona producto para simular</li>
                      <li>Ajusta parámetros:
                        <ul>
                          <li>Demanda diaria esperada</li>
                          <li>Lead time (días)</li>
                          <li>Nivel de servicio deseado (90%, 95%, 99%)</li>
                          <li>Variabilidad de demanda</li>
                        </ul>
                      </li>
                      <li>Sistema calcula ROP con nuevos parámetros</li>
                      <li>Muestra comparación con ROP actual</li>
                      <li>Visualiza escenarios de stockout</li>
                      <li>Opción: Aplicar nuevo ROP al producto</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> ROP optimizado basado en simulación</li>
                </ul>

                <h4>4. Monitoreo y Alertas</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema (Automático)</li>
                  <li><strong>Frecuencia:</strong> Tiempo real</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Compara stock actual vs ROP para cada producto</li>
                      <li>Cuando <code>cantidad_stock ≤ ai_reorder_point</code>:
                        <ul>
                          <li>Genera alerta en <code>SmartReplenishmentWidget</code></li>
                          <li>Calcula cantidad sugerida de orden</li>
                          <li>Identifica proveedor preferido</li>
                          <li>Estima fecha de agotamiento</li>
                        </ul>
                      </li>
                      <li>Notifica a planificador de inventario</li>
                      <li>Opción: Auto-generar PO si configurado</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Alertas proactivas de reabastecimiento</li>
                </ul>

                <h4>5. Ajuste Continuo (Machine Learning)</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema IA (Mensual)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Analiza precisión de ROP anterior:
                        <ul>
                          <li>¿Se presentaron stockouts?</li>
                          <li>¿Exceso de inventario?</li>
                          <li>¿Demanda real vs predicha?</li>
                        </ul>
                      </li>
                      <li>Ajusta parámetros del modelo:
                        <ul>
                          <li>Factor de seguridad</li>
                          <li>Peso de estacionalidad</li>
                          <li>Ventana de datos históricos</li>
                        </ul>
                      </li>
                      <li>Recalcula ROP con modelo mejorado</li>
                      <li>Registra métricas de precisión</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Modelo auto-optimizado continuamente</li>
                </ul>

                <h3>Diagrama de Proceso - Cálculo ROP</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`graph TD
    A[Cron Job Diario] --> B[Extraer Datos Históricos]
    B --> C[Calcular Demanda Diaria]
    C --> D[Calcular Desviación Estándar]
    D --> E[Obtener Lead Time Proveedor]
    E --> F[Determinar Nivel de Servicio]
    F --> G[Calcular Safety Stock]
    G --> H[ROP = Demanda × Lead Time + Safety Stock]
    H --> I{¿Ajuste Estacional?}
    I -->|Sí| J[Aplicar Factor Estacional]
    I -->|No| K[Guardar ROP]
    J --> K
    K --> L[Actualizar products.ai_reorder_point]
    L --> M[Comparar Stock Actual vs ROP]
    M --> N{Stock ≤ ROP?}
    N -->|Sí| O[Generar Alerta]
    O --> P[Calcular Cantidad Sugerida]
    P --> Q[SmartReplenishmentWidget]
    Q --> R{¿Auto-generar PO?}
    R -->|Sí| S[Crear PO Automática]
    R -->|No| T[Notificar Planificador]
    S --> U[Fin]
    T --> U
    N -->|No| U

    style A fill:#e3f2fd
    style H fill:#fff3e0
    style K fill:#e8f5e9
    style O fill:#ffebee
    style S fill:#fff3e0`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Diagrama de Secuencia - Flujo IA</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`sequenceDiagram
    participant CRON as Cron Job
    participant AI as AI Engine
    participant DB as Database
    participant DASH as Dashboard
    participant USER as Planificador
    participant PO as Purchase Orders

    CRON->>AI: Trigger Cálculo Diario
    AI->>DB: Fetch Sales History (90d)
    DB-->>AI: Historical Data
    AI->>DB: Fetch Supplier Lead Times
    DB-->>AI: Lead Time Data
    AI->>AI: Calcular Demanda Promedio
    AI->>AI: Calcular Desviación Estándar
    AI->>AI: Calcular Safety Stock
    AI->>AI: ROP = f(demanda, lead_time, safety)
    AI->>DB: Update ai_reorder_point
    AI->>DB: Check Stock Levels
    DB-->>AI: Current Stock Data
    AI->>AI: Comparar Stock vs ROP
    alt Stock Below ROP
        AI->>DASH: Generate Alert
        DASH->>USER: Mostrar Alerta Crítica
        USER->>DASH: Ver Detalles + Cantidad Sugerida
        USER->>PO: Crear PO Manual
    else Auto-Generate Enabled
        AI->>PO: Auto-Create Draft PO
        PO->>USER: Notify Draft PO for Review
    end
    USER->>AI: Review ROP Accuracy (monthly)
    AI->>AI: Adjust ML Model Parameters
    AI->>DB: Update ROP with Improved Model`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Componentes del Sistema</h3>
                <ul>
                  <li><strong>ReorderPointCalculator:</strong> Interfaz para ver y ajustar ROP por producto</li>
                  <li><strong>ROPSimulator:</strong> Herramienta de simulación de escenarios what-if</li>
                  <li><strong>ProductSalesHistoryChart:</strong> Visualización de tendencias de demanda</li>
                  <li><strong>SmartReplenishmentWidget:</strong> Panel de alertas y recomendaciones</li>
                </ul>

                <h3>Factores Considerados por la IA</h3>
                <ul>
                  <li>Demanda histórica (últimos 90 días)</li>
                  <li>Variabilidad de demanda (desviación estándar)</li>
                  <li>Lead time del proveedor</li>
                  <li>Nivel de servicio deseado (95% default)</li>
                  <li>Estacionalidad (si aplica)</li>
                  <li>Tendencias de crecimiento/declive</li>
                  <li>Costo de mantener inventario</li>
                  <li>Costo de stockout</li>
                </ul>

                <h3>Métricas de Desempeño del Modelo</h3>
                <ul>
                  <li><strong>Stockout Rate:</strong> % de veces que se agotó el stock</li>
                  <li><strong>Excess Inventory Days:</strong> Días promedio de exceso de inventario</li>
                  <li><strong>Fill Rate:</strong> % de demanda satisfecha sin demora</li>
                  <li><strong>Inventory Turnover:</strong> Rotación de inventario</li>
                  <li><strong>Forecast Accuracy:</strong> Precisión de predicción de demanda</li>
                </ul>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="prediccion" className="space-y-6 mt-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Predicción de Inventario IA</h2>
              
              <div className="prose max-w-none dark:prose-invert">
                <h3>Descripción General</h3>
                <p>
                  El módulo de Predicción de Inventario IA utiliza modelos de forecasting para predecir
                  demanda futura, identificar productos en riesgo de agotamiento y sugerir cantidades
                  óptimas de reorden.
                </p>

                <h3>SOP: Predicción y Forecasting</h3>
                
                <h4>1. Generación de Forecasts</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema IA (Automático)</li>
                  <li><strong>Ubicación:</strong> Edge Function <code>predict-inventory</code></li>
                  <li><strong>Frecuencia:</strong> Diario (01:00 hrs)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Edge function invocada por cron job</li>
                      <li>Para cada producto activo:
                        <ul>
                          <li>Extrae historial de ventas (90 días)</li>
                          <li>Calcula tendencia usando regresión lineal</li>
                          <li>Identifica patrones estacionales</li>
                          <li>Aplica modelo ARIMA o Prophet para forecast</li>
                        </ul>
                      </li>
                      <li>Genera predicción de demanda para próximos 30 días</li>
                      <li>Calcula días hasta stockout:
                        <pre className="bg-muted p-2 rounded text-sm">
days_until_stockout = stock_actual / demanda_diaria_predicha
                        </pre>
                      </li>
                      <li>Determina cantidad sugerida de reorden:
                        <pre className="bg-muted p-2 rounded text-sm">
suggested_qty = (demanda_predicha_30d × 1.2) - stock_actual
                        </pre>
                      </li>
                      <li>Guarda en tabla <code>inventory_forecast</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Forecasts generados para todos los productos</li>
                </ul>

                <h4>2. Análisis de Riesgo de Churn</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema IA</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Analiza productos con ventas decrecientes</li>
                      <li>Calcula <code>ai_churn_risk</code> (0-1):
                        <ul>
                          <li>0.0-0.3: Bajo riesgo</li>
                          <li>0.3-0.6: Riesgo medio</li>
                          <li>0.6-1.0: Alto riesgo de discontinuación</li>
                        </ul>
                      </li>
                      <li>Factores considerados:
                        <ul>
                          <li>Tendencia de ventas últimos 90 días</li>
                          <li>Comparación con productos similares</li>
                          <li>Rotación de inventario</li>
                          <li>Días promedio para vender</li>
                        </ul>
                      </li>
                      <li>Actualiza <code>products.ai_churn_risk</code></li>
                      <li>Genera alertas para productos de alto riesgo</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Productos marcados con riesgo de churn</li>
                </ul>

                <h4>3. Revisión de Forecasts (Dashboard)</h4>
                <ul>
                  <li><strong>Actor:</strong> Planificador de Demanda</li>
                  <li><strong>Ubicación:</strong> /admin/inventario-ia</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Accede al dashboard de predicción</li>
                      <li>Revisa métricas generales:
                        <ul>
                          <li>Total de productos monitoreados</li>
                          <li>Stock total en unidades y valor</li>
                          <li>Productos bajo stock crítico</li>
                          <li>Productos sin stock</li>
                        </ul>
                      </li>
                      <li>Analiza tabla de predicciones ordenada por urgencia</li>
                      <li>Identifica productos con:
                        <ul>
                          <li><code>days_until_stockout &lt; 7</code>: CRÍTICO</li>
                          <li><code>days_until_stockout 7-14</code>: ADVERTENCIA</li>
                          <li><code>days_until_stockout &gt; 14</code>: SALUDABLE</li>
                        </ul>
                      </li>
                      <li>Revisa confidence level de predicciones</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Visibilidad de riesgos de inventario</li>
                </ul>

                <h4>4. Generación Automática de POs</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema / Planificador</li>
                  <li><strong>Ubicación:</strong> /admin/inventario-ia</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Para productos con <code>reorder_alert = true</code>:</li>
                      <li>Planificador hace clic en "Crear Orden de Compra"</li>
                      <li>Sistema pre-completa datos:
                        <ul>
                          <li>Producto y cantidad sugerida</li>
                          <li>Proveedor preferido</li>
                          <li>Prioridad basada en urgencia</li>
                          <li>Fecha de entrega requerida</li>
                        </ul>
                      </li>
                      <li>Guarda metadata en <code>purchase_orders.ai_recommendation</code>:
                        <pre className="bg-muted p-2 rounded text-sm">{`{
  "source": "inventory_forecast",
  "forecast_date": "2025-01-15",
  "predicted_stockout": "2025-01-22",
  "confidence": 0.87
}`}</pre>
                      </li>
                      <li>Crea PO en estado DRAFT</li>
                      <li>Planificador revisa y aprueba</li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> PO creada basada en predicción IA</li>
                </ul>

                <h4>5. Monitoreo de Precisión</h4>
                <ul>
                  <li><strong>Actor:</strong> Sistema (Mensual)</li>
                  <li><strong>Pasos:</strong>
                    <ol>
                      <li>Compara predicciones vs demanda real</li>
                      <li>Calcula métricas de error:
                        <ul>
                          <li>MAE (Mean Absolute Error)</li>
                          <li>MAPE (Mean Absolute Percentage Error)</li>
                          <li>RMSE (Root Mean Square Error)</li>
                        </ul>
                      </li>
                      <li>Identifica productos con mayor desviación</li>
                      <li>Ajusta parámetros del modelo</li>
                      <li>Actualiza confidence levels</li>
                      <li>Registra en <code>ai_consumption_logs</code></li>
                    </ol>
                  </li>
                  <li><strong>Resultado:</strong> Modelo mejorado continuamente</li>
                </ul>

                <h3>Diagrama de Proceso - Predicción de Inventario</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`graph TD
    A[Cron Job Diario 01:00] --> B[Edge Function: predict-inventory]
    B --> C[Extraer Histórico Ventas 90d]
    C --> D[Por Cada Producto]
    D --> E[Calcular Tendencia]
    E --> F[Identificar Estacionalidad]
    F --> G[Aplicar Modelo ARIMA/Prophet]
    G --> H[Predecir Demanda 30 días]
    H --> I[Calcular Días hasta Stockout]
    I --> J{Días < 14?}
    J -->|Sí| K[Marcar reorder_alert = true]
    J -->|No| L[reorder_alert = false]
    K --> M[Calcular Cantidad Sugerida]
    L --> M
    M --> N[Determinar Confidence Level]
    N --> O[Guardar en inventory_forecast]
    O --> P[Calcular ai_churn_risk]
    P --> Q[Actualizar products table]
    Q --> R[Dashboard Se Actualiza]
    R --> S{Usuario Revisa}
    S --> T[Identificar Productos Críticos]
    T --> U{¿Crear PO?}
    U -->|Sí| V[Auto-generar PO Draft]
    V --> W[Incluir ai_recommendation metadata]
    W --> X[Planificador Aprueba]
    U -->|No| Y[Solo Monitorear]
    X --> Z[Fin]
    Y --> Z

    style A fill:#e3f2fd
    style G fill:#fff3e0
    style K fill:#ffebee
    style V fill:#fff3e0
    style Z fill:#e0e0e0`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Diagrama de Secuencia - Sistema de Predicción</h3>
              </div>

              <div className="my-6 bg-muted/30 p-4 rounded-lg overflow-x-auto">
                <div className="mermaid-diagram">
                  <pre className="text-xs">
{`sequenceDiagram
    participant CRON as Cron Scheduler
    participant EF as Edge Function
    participant DB as Database
    participant AI as AI Model
    participant DASH as Dashboard
    participant USER as Planificador
    participant PO as Purchase Orders

    CRON->>EF: Trigger predict-inventory
    EF->>DB: Fetch Products + Sales History
    DB-->>EF: Historical Data (90 days)
    EF->>AI: Send Data for Forecasting
    AI->>AI: Apply ARIMA Model
    AI->>AI: Calculate Trend + Seasonality
    AI-->>EF: Forecasted Demand (30d)
    EF->>EF: Calculate days_until_stockout
    EF->>EF: Calculate suggested_reorder_qty
    EF->>EF: Determine confidence_level
    EF->>DB: Insert into inventory_forecast
    EF->>DB: Update ai_reorder_point
    EF->>DB: Update ai_churn_risk
    DB-->>DASH: Real-time Update
    DASH->>USER: Show Critical Alerts
    USER->>DASH: Review Products Below ROP
    USER->>DASH: Click "Create PO" on Product
    DASH->>PO: Auto-generate PO Draft
    PO->>PO: Include ai_recommendation metadata
    PO->>USER: Notify Draft PO Ready
    USER->>PO: Review and Approve
    PO->>DB: Update PO Status to SENT
    
    Note over EF,DB: Monthly Accuracy Check
    EF->>DB: Fetch Actual vs Predicted
    EF->>AI: Calculate Forecast Errors (MAE, MAPE)
    AI->>AI: Adjust Model Parameters
    AI->>DB: Update Confidence Levels`}
                  </pre>
                </div>
              </div>

              <div className="prose max-w-none dark:prose-invert">
                <h3>Componentes del Dashboard</h3>
                <ul>
                  <li><strong>AIConsumptionDashboard:</strong> Métricas de uso y costo de IA</li>
                  <li><strong>AIStockAlertWidget:</strong> Alertas de productos críticos</li>
                  <li><strong>AutoGeneratedPOsPanel:</strong> Historial de POs generadas por IA</li>
                  <li><strong>POMetricsDashboard:</strong> Métricas de rendimiento de POs</li>
                  <li><strong>InventoryForecast:</strong> Tabla detallada de predicciones</li>
                </ul>

                <h3>Algoritmos Utilizados</h3>
                <ul>
                  <li><strong>ARIMA:</strong> Para series temporales con tendencia</li>
                  <li><strong>Prophet:</strong> Para datos con estacionalidad fuerte</li>
                  <li><strong>Exponential Smoothing:</strong> Para predicciones a corto plazo</li>
                  <li><strong>Linear Regression:</strong> Para identificar tendencias</li>
                  <li><strong>K-Means Clustering:</strong> Para segmentar productos por comportamiento</li>
                </ul>

                <h3>Niveles de Confianza</h3>
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th>Nivel</th>
                      <th>Descripción</th>
                      <th>Acción Recomendada</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><code>HIGH (90-100%)</code></td>
                      <td>Datos históricos abundantes, patrón estable</td>
                      <td>Automatizar decisiones de reorden</td>
                    </tr>
                    <tr>
                      <td><code>MEDIUM (70-89%)</code></td>
                      <td>Datos suficientes, variabilidad moderada</td>
                      <td>Revisar recomendaciones antes de aprobar</td>
                    </tr>
                    <tr>
                      <td><code>LOW (&lt;70%)</code></td>
                      <td>Datos limitados o patrón irregular</td>
                      <td>Usar juicio humano, no automatizar</td>
                    </tr>
                  </tbody>
                </table>

                <h3>Métricas de Valor del Sistema IA</h3>
                <ul>
                  <li><strong>Stockout Prevention Rate:</strong> % de stockouts evitados vs periodo anterior</li>
                  <li><strong>Inventory Reduction:</strong> % de reducción en días de inventario</li>
                  <li><strong>Forecast Accuracy:</strong> % de predicciones dentro de ±10% de demanda real</li>
                  <li><strong>Auto-PO Success Rate:</strong> % de POs automáticas que se completan sin modificación</li>
                  <li><strong>Cost Savings:</strong> Ahorro en costos de mantener inventario + stockouts</li>
                </ul>

                <h3>Integración con Otros Módulos</h3>
                <ul>
                  <li><strong>Punto de Reorden IA:</strong> Usa predicciones para calcular ROP dinámicos</li>
                  <li><strong>Órdenes de Compra:</strong> Auto-genera POs basadas en forecasts</li>
                  <li><strong>Gestión de Pedidos:</strong> Prioriza fulfillment basado en predicción de demanda</li>
                  <li><strong>Analytics:</strong> Alimenta dashboards ejecutivos con KPIs predictivos</li>
                </ul>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
