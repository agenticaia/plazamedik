import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, AlertCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { CreateProductDialog } from '@/components/admin/CreateProductDialog';
import { EditProductDialog } from '@/components/admin/EditProductDialog';
import { DiscontinueProductDialog } from '@/components/admin/DiscontinueProductDialog';
import { Card } from '@/components/ui/card';

export default function Products() {
  const { products, loading, refetch } = useProducts(true); // Admin view - mostrar todos
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [discontinueDialogOpen, setDiscontinueDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const filteredProducts = products.filter(product =>
    product.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.product_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setEditDialogOpen(true);
  };

  const handleDiscontinue = (product: any) => {
    setSelectedProduct(product);
    setDiscontinueDialogOpen(true);
  };

  const handleSuccess = () => {
    refetch();
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDiscontinueDialogOpen(false);
    setSelectedProduct(null);
  };

  return (
    <AdminLayout>
      <div className="p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground truncate">
              Gestión de Productos
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Administra el catálogo de productos del e-commerce
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span className="sm:inline">Crear Producto</span>
          </Button>
        </div>

        {/* Search & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="col-span-1 md:col-span-3 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o código de producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </Card>
          <Card className="p-4 flex flex-col justify-center">
            <p className="text-sm text-muted-foreground">Total Productos</p>
            <p className="text-2xl font-bold">{products.length}</p>
          </Card>
        </div>

        {/* Products Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Código</TableHead>
                  <TableHead className="whitespace-nowrap">Imagen</TableHead>
                  <TableHead className="whitespace-nowrap">Nombre</TableHead>
                  <TableHead className="whitespace-nowrap">Categoría</TableHead>
                  <TableHead className="whitespace-nowrap">Precio</TableHead>
                  <TableHead className="whitespace-nowrap">Stock</TableHead>
                  <TableHead className="whitespace-nowrap">Estado</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Cargando productos...
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron productos
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                       <TableCell className="font-mono text-sm">{product.product_code}</TableCell>
                      <TableCell>
                        <img
                          src={product.imagen_url || '/placeholder.svg'}
                          alt={product.nombre_producto}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{product.nombre_producto}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.categoria}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        S/ {Number(product.precio).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={(product.cantidad_stock || 0) > 10 ? 'default' : (product.cantidad_stock || 0) > 0 ? 'secondary' : 'destructive'}>
                          {product.cantidad_stock || 0} unidades
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={(product.cantidad_stock || 0) > 0 ? 'default' : 'destructive'}>
                          {(product.cantidad_stock || 0) > 0 ? 'Disponible' : 'Agotado'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDiscontinue(product)}
                          >
                            <AlertCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Dialogs */}
      <CreateProductDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleSuccess}
      />

      {selectedProduct && (
        <>
          <EditProductDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            product={selectedProduct}
            onSuccess={handleSuccess}
          />
          <DiscontinueProductDialog
            open={discontinueDialogOpen}
            onOpenChange={setDiscontinueDialogOpen}
            product={selectedProduct}
            onSuccess={handleSuccess}
          />
        </>
      )}
    </AdminLayout>
  );
}
