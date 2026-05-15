import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface RequiredLabelProps extends React.ComponentProps<typeof Label> {
  children: React.ReactNode;
  required?: boolean;
}

/** Field label with optional red asterisk for mandatory fields. */
export function RequiredLabel({ children, required = true, className, ...props }: RequiredLabelProps) {
  return (
    <Label className={cn(className)} {...props}>
      {children}
      {required ? <span className="ml-0.5 text-destructive">*</span> : null}
    </Label>
  );
}
