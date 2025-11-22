import { AlertTriangle, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface BackorderBadgeProps {
  isBackorder: boolean;
  linkedPurchaseOrderId?: string | null;
  linkedPONumber?: string;
}

export const BackorderBadge = ({ 
  isBackorder, 
  linkedPurchaseOrderId, 
  linkedPONumber 
}: BackorderBadgeProps) => {
  const navigate = useNavigate();

  if (!isBackorder) return null;

  const handleNavigateToPO = () => {
    if (linkedPurchaseOrderId) {
      navigate("/admin/ordenes-compra");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Backorder
      </Badge>
      {linkedPurchaseOrderId && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleNavigateToPO}
          className="h-6 px-2 text-xs flex items-center gap-1"
        >
          <Link2 className="h-3 w-3" />
          {linkedPONumber || "Ver OC"}
        </Button>
      )}
    </div>
  );
};
