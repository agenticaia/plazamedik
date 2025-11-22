import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, Download, QrCode } from "lucide-react";
import { SalesOrder } from "@/hooks/useSalesOrders";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ShippingLabelPrintProps {
  order: SalesOrder;
  trigger?: React.ReactNode;
}

export const ShippingLabelPrint = ({ order, trigger }: ShippingLabelPrintProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Guía de Remisión - ${order.order_number}</title>
          <style>
            @media print {
              @page { size: A5; margin: 10mm; }
              body { margin: 0; padding: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              max-width: 600px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .section {
              margin-bottom: 15px;
            }
            .label {
              font-weight: bold;
              font-size: 12px;
              color: #666;
            }
            .value {
              font-size: 14px;
              margin-top: 2px;
            }
            .large-text {
              font-size: 18px;
              font-weight: bold;
            }
            .qr-container {
              text-align: center;
              margin: 20px 0;
              padding: 20px;
              border: 2px dashed #ccc;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .items-table th,
            .items-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 12px;
            }
            .items-table th {
              background-color: #f5f5f5;
            }
            .footer {
              margin-top: 30px;
              padding-top: 15px;
              border-top: 1px solid #ddd;
              text-align: center;
              font-size: 11px;
              color: #666;
            }
            .barcode {
              font-family: 'Courier New', monospace;
              font-size: 24px;
              letter-spacing: 2px;
              text-align: center;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const generateQRData = () => {
    return `https://plazamedik.lovable.app/seguimiento?codigo=${order.order_number}`;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Imprimir Guía
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Guía de Remisión y Etiqueta de Envío</DialogTitle>
        </DialogHeader>

        {/* Preview del documento */}
        <div ref={printRef} className="bg-white p-8 border rounded-lg">
          {/* Header */}
          <div className="text-center mb-6 border-b-2 border-gray-800 pb-4">
            <h1 className="text-2xl font-bold">PLAZA MEDIK</h1>
            <p className="text-sm text-muted-foreground">Guía de Remisión</p>
            <div className="mt-2 font-mono text-lg font-bold">
              {order.order_number}
            </div>
          </div>

          {/* Información del destinatario */}
          <div className="mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-3">DESTINATARIO:</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-600">Nombre:</span>
                  <p className="font-semibold text-lg">
                    {order.customer_name} {order.customer_lastname}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Teléfono:</span>
                  <p className="font-semibold">{order.customer_phone}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Distrito:</span>
                  <p className="font-semibold">{order.customer_district}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Detalles del envío */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <span className="text-sm text-gray-600 block">Fecha de Orden:</span>
              <p className="font-semibold">
                {format(new Date(order.created_at), "dd/MM/yyyy", { locale: es })}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600 block">Método de Pago:</span>
              <p className="font-semibold uppercase">
                {order.payment_method || 'N/A'}
              </p>
            </div>
            {order.courier && (
              <div>
                <span className="text-sm text-gray-600 block">Courier:</span>
                <p className="font-semibold">{order.courier}</p>
              </div>
            )}
            {order.tracking_number && (
              <div>
                <span className="text-sm text-gray-600 block">N° Seguimiento:</span>
                <p className="font-mono font-semibold">{order.tracking_number}</p>
              </div>
            )}
          </div>

          {/* Items del pedido */}
          <div className="mb-6">
            <h3 className="font-bold mb-2">PRODUCTOS:</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left text-sm">Producto</th>
                  <th className="border border-gray-300 px-3 py-2 text-center text-sm">Cant.</th>
                  <th className="border border-gray-300 px-3 py-2 text-right text-sm">Precio</th>
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      <div>{item.product_name}</div>
                      {item.product_color && (
                        <div className="text-xs text-gray-500">Color: {item.product_color}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {item.quantity}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right">
                      S/ {Number(item.unit_price).toFixed(2)}
                    </td>
                  </tr>
                ))}
                <tr className="font-bold bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2" colSpan={2}>
                    TOTAL:
                  </td>
                  <td className="border border-gray-300 px-3 py-2 text-right">
                    S/ {Number(order.total).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* QR Code */}
          <div className="text-center my-6 p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <p className="text-sm text-gray-600 mb-3 font-semibold">Código QR para seguimiento en línea:</p>
            <div className="bg-white p-4 rounded inline-block border-2 border-gray-200">
              <QRCodeSVG 
                value={generateQRData()}
                size={192}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-gray-500 mt-3 break-all px-4">
              {generateQRData()}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Escanear para rastrear tu pedido en tiempo real
            </p>
          </div>

          {/* Firma y observaciones */}
          <div className="mt-8 pt-6 border-t">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm text-gray-600 mb-4">Entregado por:</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-xs text-center">Firma y Sello</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-4">Recibido por:</p>
                <div className="border-t border-gray-400 pt-2">
                  <p className="text-xs text-center">Firma y DNI</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t text-center text-xs text-gray-500">
            <p>Plaza Medik - Productos de Salud y Bienestar</p>
            <p>Documento generado el {format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}</p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
          <Button variant="default" onClick={handlePrint}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
