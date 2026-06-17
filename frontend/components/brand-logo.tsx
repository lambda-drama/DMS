import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  APP_PRODUCT_NAME,
  APP_SHORT_NAME,
  SUWEYS_LOGO_URL,
} from '@/lib/branding';

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'sidebar';
}

const sizeMap = {
  sm: { box: 'h-8 w-8', image: 32, text: 'text-sm' },
  md: { box: 'h-10 w-10', image: 40, text: 'text-sm' },
  lg: { box: 'h-16 w-16', image: 64, text: 'text-3xl' },
};

export function BrandLogo({
  className,
  imageClassName,
  showText = true,
  size = 'md',
  variant = 'default',
}: BrandLogoProps) {
  const sizing = sizeMap[size];
  const isSidebar = variant === 'sidebar';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white',
          sizing.box,
          imageClassName,
        )}
      >
        <Image
          src={SUWEYS_LOGO_URL}
          alt={`${APP_SHORT_NAME} logo`}
          width={sizing.image}
          height={sizing.image}
          className="h-full w-full object-contain p-0.5"
          priority
        />
      </div>
      {showText ? (
        <div className="min-w-0">
          <p
            className={cn(
              'font-semibold leading-tight',
              sizing.text,
              isSidebar && 'text-sidebar-foreground',
            )}
          >
            {APP_SHORT_NAME}
          </p>
          <p
            className={cn(
              'text-xs',
              isSidebar ? 'text-sidebar-foreground/70' : 'text-muted-foreground',
            )}
          >
            {APP_PRODUCT_NAME}
          </p>
        </div>
      ) : null}
    </div>
  );
}
