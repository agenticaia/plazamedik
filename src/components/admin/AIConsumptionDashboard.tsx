import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart3, DollarSign, Activity, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsumptionStats {
  total_calls: number;
  total_cost_usd: number;
  total_cost_soles: number;
  by_feature: { [key: string]: number };
  daily_cost: { date: string; cost: number }[];
}

export default function AIConsumptionDashboard() {
  const [stats, setStats] = useState<ConsumptionStats | null>(null);
  const [period, setPeriod] = useState<'week' | 'month'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      const daysAgo = period === 'week' ? 7 : 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data, error } = await supabase
        .from('ai_consumption_logs')
        .select('*')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        setStats({
          total_calls: 0,
          total_cost_usd: 0,
          total_cost_soles: 0,
          by_feature: {},
          daily_cost: []
        });
        setLoading(false);
        return;
      }

      const totalCalls = data.length;
      const totalCostUsd = data.reduce((sum, log) => sum + (log.cost_usd || 0), 0);
      const totalCostSoles = totalCostUsd * 3.8;

      const byFeature: { [key: string]: number } = {};
      data.forEach(log => {
        byFeature[log.feature] = (byFeature[log.feature] || 0) + 1;
      });

      const dailyCostMap: { [key: string]: number } = {};
      data.forEach(log => {
        const date = new Date(log.created_at).toLocaleDateString('es-PE');
        dailyCostMap[date] = (dailyCostMap[date] || 0) + (log.cost_usd || 0);
      });

      const dailyCost = Object.entries(dailyCostMap)
        .map(([date, cost]) => ({ date, cost }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setStats({
        total_calls: totalCalls,
        total_cost_usd: totalCostUsd,
        total_cost_soles: totalCostSoles,
        by_feature: byFeature,
        daily_cost: dailyCost
      });
    } catch (error) {
      console.error('Error fetching AI consumption:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;
    
    const csvContent = `Período,${period}\nTotal Llamadas,${stats.total_calls}\nCosto USD,${stats.total_cost_usd.toFixed(2)}\nCosto Soles,S/ ${stats.total_cost_soles.toFixed(2)}\n\nPor Módulo:\n${Object.entries(stats.by_feature).map(([f, c]) => `${f},${c}`).join('\n')}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai_consumption_${period}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center">
            <BarChart3 className="w-7 h-7 mr-2 text-primary" />
            Consumo de IA
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoreo de uso y costos de operaciones de inteligencia artificial
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setPeriod('week')}
            variant={period === 'week' ? 'default' : 'outline'}
          >
            7 días
          </Button>
          <Button
            onClick={() => setPeriod('month')}
            variant={period === 'month' ? 'default' : 'outline'}
          >
            30 días
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Llamadas</p>
              <p className="text-3xl font-bold text-primary">{stats.total_calls.toLocaleString()}</p>
            </div>
            <Activity className="w-12 h-12 text-primary/20" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Costo en Soles</p>
              <p className="text-3xl font-bold text-green-600">S/ {stats.total_cost_soles.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Costo Soles</p>
              <p className="text-3xl font-bold text-purple-600">S/ {stats.total_cost_soles.toFixed(2)}</p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm p-6">
        <h3 className="font-bold text-lg mb-4 text-foreground">Distribución por Módulo</h3>
        <div className="space-y-3">
          {Object.entries(stats.by_feature).map(([feature, count]) => {
            const percentage = (count / stats.total_calls) * 100;
            return (
              <div key={feature} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground capitalize w-32">
                  {feature}
                </span>
                <div className="flex-1 mx-4">
                  <div className="bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <span className="font-semibold text-foreground w-20 text-right">
                  {count} ({percentage.toFixed(1)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <Button
        onClick={exportToCSV}
        className="w-full"
        variant="default"
      >
        <Download className="w-5 h-5 mr-2" />
        Descargar Reporte CSV
      </Button>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <p className="text-sm text-primary">
          <strong>💡 Nota:</strong> Los costos mostrados son estimados. Las recomendaciones K-NN 
          no generan costo de API. Solo el chatbot (si está activo) consume tokens de OpenAI.
        </p>
      </div>
    </div>
  );
}
