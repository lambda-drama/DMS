'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type DecimalInputProps = Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'onChange' | 'inputMode'
> & {
  value: number | null | undefined;
  onValueChange: (value: number) => void;
  /** Show blank when value is 0 / empty (default). */
  blankWhenZero?: boolean;
};

function isAllowedDecimalText(raw: string) {
  return raw === '' || /^-?\d*\.?\d*$/.test(raw);
}

function toCommitNumber(raw: string): number {
  if (raw === '' || raw === '.' || raw === '-' || raw === '-.') return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

function displayFromValue(value: number | null | undefined, blankWhenZero: boolean) {
  if (value == null || Number.isNaN(value)) return '';
  if (blankWhenZero && value === 0) return '';
  return String(value);
}

/**
 * Numeric text input that allows typing values like 0.3.
 * Keeps intermediate strings ("0.", ".") while focused so controlled number
 * state does not wipe the decimal point.
 */
function DecimalInput({
  value,
  onValueChange,
  blankWhenZero = true,
  className,
  onBlur,
  onFocus,
  ...props
}: DecimalInputProps) {
  const [focused, setFocused] = React.useState(false);
  const [text, setText] = React.useState(() => displayFromValue(value, blankWhenZero));

  React.useEffect(() => {
    if (!focused) {
      setText(displayFromValue(value, blankWhenZero));
    }
  }, [value, focused, blankWhenZero]);

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      className={cn(className)}
      value={text}
      onFocus={(e) => {
        setFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        const next = toCommitNumber(text);
        onValueChange(next);
        setText(displayFromValue(next, blankWhenZero));
        onBlur?.(e);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (!isAllowedDecimalText(raw)) return;
        setText(raw);
        if (raw === '' || raw === '.' || raw === '-' || raw === '-.') {
          onValueChange(0);
          return;
        }
        const n = parseFloat(raw);
        if (Number.isFinite(n)) onValueChange(n);
      }}
    />
  );
}

export { DecimalInput };
