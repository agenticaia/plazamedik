import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useState, KeyboardEvent } from 'react';

interface MultiSelectChipsProps {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function MultiSelectChips({ label, items, onChange, placeholder, suggestions = [] }: MultiSelectChipsProps) {
  const [inputValue, setInputValue] = useState('');

  const addItem = (value: string) => {
    const trimmed = value.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setInputValue('');
  };

  const removeItem = (itemToRemove: string) => {
    onChange(items.filter(item => item !== itemToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addItem(inputValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, index) => (
          <Badge key={index} variant="secondary" className="flex items-center gap-1">
            {item}
            <button
              type="button"
              onClick={() => removeItem(item)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || 'Escribe y presiona Enter'}
      />
      {suggestions.length > 0 && inputValue === '' && (
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-sm text-muted-foreground">Sugerencias:</span>
          {suggestions.map((suggestion, index) => (
            <Badge
              key={index}
              variant="outline"
              className="cursor-pointer hover:bg-muted"
              onClick={() => addItem(suggestion)}
            >
              + {suggestion}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
