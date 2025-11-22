import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePurchaseOrderItems } from "@/hooks/usePurchaseOrderItems";

interface POItemsSummaryProps {
  poId: string;
}

export function POItemsSummary({ poId }: POItemsSummaryProps) {
  const { items, isLoading } = usePurchaseOrderItems(poId);

  if (isLoading) {
    return <span className="text-sm text-muted-foreground animate-pulse">Cargando...</span>;
  }

  if (!items || items.length === 0) {
    return <span className="text-sm text-muted-foreground">Sin items</span>;
  }

  const totalSKUs = new Set(items.map(item => item.product_code)).size;
  const firstItem = items[0];
  const hasMore = items.length > 1;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 cursor-help">
            <Badge variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {totalSKUs} SKU{totalSKUs !== 1 ? 's' : ''}
            </Badge>
            <div className="text-sm">
              <span className="font-medium">{firstItem.product_name}</span>
              {hasMore && (
                <span className="text-muted-foreground"> +{items.length - 1} más</span>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          <div className="space-y-1">
            <p className="font-semibold">Productos en esta orden:</p>
            <ul className="text-xs space-y-1">
              {items.slice(0, 5).map(item => (
                <li key={item.id} className="flex justify-between gap-4">
                  <span>{item.product_name}</span>
                  <span className="text-muted-foreground">{item.qty_ordered} unid.</span>
                </li>
              ))}
              {items.length > 5 && (
                <li className="text-muted-foreground italic">
                  +{items.length - 5} productos más
                </li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
