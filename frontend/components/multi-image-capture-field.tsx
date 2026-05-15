'use client';

import { ImageCaptureField } from '@/components/image-capture-field';
import { cn } from '@/lib/utils';

export interface ImageCaptureSlot {
  id: string;
  label: string;
}

interface MultiImageCaptureFieldProps {
  label?: string;
  slots: ImageCaptureSlot[];
  value: Record<string, string | undefined>;
  onChange: (value: Record<string, string | undefined>) => void;
  className?: string;
  disabled?: boolean;
}

/** Labeled photo slots (e.g. Front / Rear / Left / Right). */
export function MultiImageCaptureField({
  label,
  slots,
  value,
  onChange,
  className,
  disabled,
}: MultiImageCaptureFieldProps) {
  const setSlot = (id: string, url: string | undefined) => {
    onChange({ ...value, [id]: url });
  };

  return (
    <div className={cn('space-y-3', className)}>
      {label ? <p className="text-sm font-medium leading-none">{label}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {slots.map((slot) => (
          <ImageCaptureField
            key={slot.id}
            label={slot.label}
            value={value[slot.id]}
            onChange={(url) => setSlot(slot.id, url)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

