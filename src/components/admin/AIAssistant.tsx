import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bot, X, Send, Loader2, Sparkles, Package, TrendingUp, 
  ShoppingCart, AlertTriangle, BarChart3, Building2, 
  DollarSign, Target, RefreshCw, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { InventoryAlertNotifications } from './InventoryAlertNotifications';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickAction {
  icon: React.ElementType;
  label: string;
  question: string;
  color: string;
}

const quickActions: QuickAction[] = [
  { 
    icon: AlertTriangle, 
    label: 'Alertas de Stock', 
    question: '¿Cuáles productos necesitan reabastecimiento urgente?', 
    color: 'text-destructive' 
  },
  { 
    icon: TrendingUp, 
    label: 'Ventas Hoy', 
    question: '¿Cuánto he vendido hoy y cuáles son los productos más vendidos?', 
    color: 'text-green-600' 
  },
  { 
    icon: Target, 
    label: 'Punto de Reorden', 
    question: 'Muéstrame el análisis ROP de mis productos y cuáles necesitan orden de compra', 
    color: 'text-blue-600' 
  },
  { 
    icon: ShoppingCart, 
    label: 'POs Automáticas', 
    question: '¿Cuántas órdenes de compra automáticas se han generado y cuál es su estado?', 
    color: 'text-purple-600' 
  },
  { 
    icon: BarChart3, 
    label: 'KPIs Ejecutivos', 
    question: 'Dame un resumen de los KPIs principales del negocio: ingresos, inventario, conversión', 
    color: 'text-orange-600' 
  },
  { 
    icon: Building2, 
    label: 'Proveedores', 
    question: 'Dame información sobre mis proveedores y sus balances pendientes', 
    color: 'text-cyan-600' 
  },
];

const navigationMenu = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: BarChart3 },
  { label: 'Ejecutivo Analytics', path: '/admin/ejecutivo', icon: TrendingUp },
  { label: 'Estadísticas Ventas', path: '/admin/estadisticas-ventas', icon: DollarSign },
  { label: 'Pagos & Finanzas', path: '/admin/pagos', icon: DollarSign },
  { label: 'Productos', path: '/admin/productos', icon: Package },
  { label: 'Órdenes de Compra', path: '/admin/ordenes-compra', icon: ShoppingCart },
  { label: 'Punto Reorden IA', path: '/admin/punto-reorden-ia', icon: Target },
  { label: 'Predicción IA', path: '/admin/inventario-ia', icon: Sparkles },
];

const STORAGE_KEY = 'ai_assistant_history';
const MAX_HISTORY_MESSAGES = 50;

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load conversation history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setMessages(parsed);
      } catch (e) {
        console.error('Error loading chat history:', e);
      }
    }
  }, []);

  // Save conversation history to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      const historyToSave = messages.slice(-MAX_HISTORY_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historyToSave));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (messageText?: string) => {
    const userMessage = messageText || input.trim();
    if (!userMessage || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '❌ Error: No estás autenticado. Por favor, inicia sesión.'
        }]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('inventory-ai-agent', {
        body: { question: userMessage },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Function error:', error);
        throw error;
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || 'No pude generar una respuesta.'
      }]);
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${error.message || 'Hubo un problema al conectar con el asistente.'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Parse inline markdown (bold, italic, code)
  const parseInlineMarkdown = (text: string) => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let keyIndex = 0;

    while (remaining.length > 0) {
      // Bold: **text** or __text__
      const boldMatch = remaining.match(/\*\*(.+?)\*\*|__(.+?)__/);
      // Code: `text`
      const codeMatch = remaining.match(/`([^`]+)`/);
      
      const boldIndex = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;
      const codeIndex = codeMatch ? remaining.indexOf(codeMatch[0]) : -1;

      // Find the first match
      let firstMatch: RegExpMatchArray | null = null;
      let firstIndex = -1;
      let matchType: 'bold' | 'code' | null = null;

      if (boldIndex !== -1 && (codeIndex === -1 || boldIndex < codeIndex)) {
        firstMatch = boldMatch;
        firstIndex = boldIndex;
        matchType = 'bold';
      } else if (codeIndex !== -1) {
        firstMatch = codeMatch;
        firstIndex = codeIndex;
        matchType = 'code';
      }

      if (firstMatch && firstIndex !== -1 && matchType) {
        // Add text before the match
        if (firstIndex > 0) {
          parts.push(remaining.substring(0, firstIndex));
        }

        // Add formatted element
        const content = firstMatch[1] || firstMatch[2];
        if (matchType === 'bold') {
          parts.push(<strong key={keyIndex++} className="font-bold">{content}</strong>);
        } else if (matchType === 'code') {
          parts.push(
            <code key={keyIndex++} className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
              {content}
            </code>
          );
        }

        remaining = remaining.substring(firstIndex + firstMatch[0].length);
      } else {
        parts.push(remaining);
        break;
      }
    }

    return parts.length > 0 ? parts : [text];
  };

  const renderMessageContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      // Skip empty lines but keep spacing
      if (line.trim() === '') {
        return <div key={i} className="h-2" />;
      }

      // Section headers with decorative lines
      if (line.includes('═══')) {
        const cleanLine = line.replace(/═/g, '').trim();
        if (cleanLine) {
          return (
            <div key={i} className="font-bold text-sm mt-4 mb-2 text-primary border-b border-primary/20 pb-1">
              {parseInlineMarkdown(cleanLine)}
            </div>
          );
        }
        return null;
      }

      // Emoji headers (lines starting with emoji)
      if (line.match(/^[📊🚨⚠️📦💰🏢📋💡✅❌🔄📈🎯🏆🛒👥💳🤖🔴🟠🟡🟢⚡]/)) {
        return (
          <div key={i} className="font-semibold text-sm mt-3 mb-1">
            {parseInlineMarkdown(line)}
          </div>
        );
      }

      // Numbered items (1. 2. 3. etc)
      if (line.match(/^\d+\.\s/)) {
        return (
          <div key={i} className="ml-2 text-sm py-0.5">
            {parseInlineMarkdown(line)}
          </div>
        );
      }

      // Bullet points
      if (line.trim().startsWith('•') || line.trim().match(/^-\s/) || line.trim().match(/^\*\s/)) {
        const indent = line.startsWith('    ') || line.startsWith('\t') ? 'ml-6' : 'ml-3';
        return (
          <div key={i} className={`${indent} text-sm py-0.5`}>
            {parseInlineMarkdown(line)}
          </div>
        );
      }

      // Lines ending with colon (section titles)
      if (line.trim().endsWith(':') && !line.includes('http') && line.length < 80) {
        return (
          <div key={i} className="font-semibold mt-2 text-sm">
            {parseInlineMarkdown(line)}
          </div>
        );
      }

      // Regular lines with inline markdown parsing
      return (
        <div key={i} className="text-sm py-0.5">
          {parseInlineMarkdown(line)}
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <>
      {/* Critical Inventory Alert Notifications */}
      <InventoryAlertNotifications onAlertClick={() => setIsOpen(true)} />

      {/* Floating AI Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-r from-primary to-primary/80",
          "hover:scale-110 transition-all duration-300",
          "animate-pulse hover:animate-none",
          isOpen && "hidden"
        )}
        size="icon"
      >
        <Sparkles className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      <div className={cn(
        "fixed inset-0 z-50 transition-all duration-300",
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      )}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Chat Panel - Centered Modal */}
        <div className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-full max-w-2xl h-[85vh] max-h-[700px]",
          "transition-all duration-300",
          isOpen ? "scale-100" : "scale-95"
        )}>
          <Card className="h-full flex flex-col shadow-2xl border-2 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Asistente IA de Inventario</h3>
                  <p className="text-xs text-primary-foreground/70">PlazaMedik ERP Intelligence</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowNav(!showNav)}
                  variant="ghost" 
                  size="sm"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <BarChart3 className="h-4 w-4 mr-1" />
                  Navegar
                </Button>
                <Button 
                  onClick={clearChat}
                  variant="ghost" 
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => setIsOpen(false)} 
                  variant="ghost" 
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Navigation Menu */}
            {showNav && (
              <div className="p-3 border-b bg-muted/50">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Navegación Rápida</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {navigationMenu.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Button
                        key={item.path}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs h-8"
                        onClick={() => handleNavigation(item.path)}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {item.label}
                        <ChevronRight className="h-3 w-3 ml-auto" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-4">
                    <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center">
                      <Bot className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold text-lg mb-2">
                      ¡Hola! Soy tu asistente inteligente de inventario
                    </h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Tengo acceso completo a tu sistema ERP. Puedo ayudarte con:
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 text-left mb-6">
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <span>Alertas de stock bajo</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span>Punto de Reorden (ROP)</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <ShoppingCart className="h-4 w-4 text-purple-600" />
                        <span>POs Automáticas</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-muted/50">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                        <span>KPIs y Analytics</span>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground font-medium mb-3">Preguntas Rápidas:</p>
                    <div className="grid gap-2">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            variant="outline"
                            className="justify-start text-left h-auto py-2 px-3"
                            onClick={() => handleSend(action.question)}
                          >
                            <Icon className={cn("h-4 w-4 mr-2 flex-shrink-0", action.color)} />
                            <span className="text-sm">{action.question}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex gap-3",
                      msg.role === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-4 py-3",
                        msg.role === 'user'
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      <div className="whitespace-pre-wrap space-y-1">
                        {renderMessageContent(msg.content)}
                      </div>
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex-shrink-0 h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-xs font-semibold">Tú</span>
                      </div>
                    )}
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Analizando datos...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 border-t bg-background">
              {messages.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                  {quickActions.slice(0, 4).map((action) => {
                    const Icon = action.icon;
                    return (
                      <Badge
                        key={action.label}
                        variant="outline"
                        className="cursor-pointer hover:bg-muted whitespace-nowrap flex-shrink-0"
                        onClick={() => handleSend(action.question)}
                      >
                        <Icon className={cn("h-3 w-3 mr-1", action.color)} />
                        {action.label}
                      </Badge>
                    );
                  })}
                </div>
              )}
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe tu pregunta sobre inventario, ventas, KPIs..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
