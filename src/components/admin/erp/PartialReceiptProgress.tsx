import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PartialReceiptProgressProps {
  qtyOrdered: number;
  qtyReceived: number;
}

export const PartialReceiptProgress = ({ 
  qtyOrdered, 
  qtyReceived 
}: PartialReceiptProgressProps) => {
  const percentage = Math.round((qtyReceived / qtyOrdered) * 100);
  const isComplete = qtyReceived >= qtyOrdered;
  const isPartial = qtyReceived > 0 && qtyReceived < qtyOrdered;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {qtyReceived} / {qtyOrdered} unidades
        </span>
        <Badge 
          variant={isComplete ? "default" : isPartial ? "secondary" : "outline"}
          className="text-xs"
        >
          {percentage}%
        </Badge>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
};
