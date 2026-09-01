'use client';

import { Mail, MessageSquareText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type SendQuotationCustomer = {
  name?: string;
  display?: string;
  email?: string;
  phone?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotationId: string;
  customer: SendQuotationCustomer;
};

function digits(phone: string) {
  return phone.replace(/\D/g, '');
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="currentColor">
      <path d="M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.41.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.46h-.52c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.68 4.14.65.28 1.16.45 1.56.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.28.23-.63.23-1.16.16-1.28-.07-.11-.25-.18-.52-.32z" />
      <path d="M12.04 2C6.5 2 2 6.48 2 12c0 1.77.46 3.45 1.28 4.91L2 22l5.23-1.37A9.96 9.96 0 0 0 12.04 22C17.56 22 22 17.52 22 12S17.56 2 12.04 2zm0 18.15c-1.67 0-3.25-.5-4.56-1.35l-.33-.2-3.1.81.83-3.02-.21-.35A8.12 8.12 0 0 1 3.88 12c0-4.5 3.66-8.15 8.16-8.15 4.5 0 8.15 3.65 8.15 8.15 0 4.49-3.65 8.15-8.15 8.15z" />
    </svg>
  );
}

function quotationSendLinks(quotationId: string, customer: SendQuotationCustomer) {
  const display = customer.display || customer.name || 'Customer';
  const email = (customer.email || '').trim();
  const phone = (customer.phone || '').trim();
  const phoneDigits = digits(phone);
  const subject = encodeURIComponent(`Quotation ${quotationId}`);
  const body = encodeURIComponent(`Hello ${display},\n\nPlease find quotation ${quotationId}.\n`);
  return {
    email,
    phone,
    phoneDigits,
    whatsapp: phoneDigits ? `https://wa.me/${phoneDigits}?text=${body}` : '',
    sms: phoneDigits ? `sms:${phoneDigits}?body=${body}` : '',
    mailto: email ? `mailto:${email}?subject=${subject}&body=${body}` : '',
  };
}

function openChannel(url: string) {
  window.open(url, '_blank', 'noopener');
}

function ChannelButton({
  label,
  description,
  disabled,
  onClick,
  className,
  children,
}: {
  label: string;
  description: string;
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex flex-1 flex-col items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-3 py-4 text-center transition-colors',
        disabled
          ? 'cursor-not-allowed opacity-40'
          : 'hover:border-primary/40 hover:bg-muted/40'
      )}
    >
      <span
        className={cn(
          'grid h-11 w-11 place-items-center rounded-full text-white shadow-sm',
          disabled ? 'bg-muted text-muted-foreground' : className
        )}
      >
        {children}
      </span>
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs text-muted-foreground">{description}</span>
    </button>
  );
}

/** Compact WhatsApp / SMS / Email actions for listing rows. */
export function QuotationSendActions({
  quotationId,
  customer,
}: {
  quotationId: string;
  customer: SendQuotationCustomer;
}) {
  const links = quotationSendLinks(quotationId, customer);
  const btn =
    'grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-35 disabled:bg-muted disabled:text-muted-foreground';
  return (
    <div className="flex items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        className={cn(btn, 'bg-[#25D366] hover:opacity-90')}
        title={links.phoneDigits ? `WhatsApp ${links.phone}` : 'No phone number'}
        aria-label="Send via WhatsApp"
        disabled={!links.whatsapp}
        onClick={() => links.whatsapp && openChannel(links.whatsapp)}
      >
        <WhatsAppIcon className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={cn(btn, 'bg-sky-600 hover:opacity-90')}
        title={links.phoneDigits ? `SMS ${links.phone}` : 'No phone number'}
        aria-label="Send via SMS"
        disabled={!links.sms}
        onClick={() => links.sms && openChannel(links.sms)}
      >
        <MessageSquareText className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        className={cn(btn, 'bg-primary hover:opacity-90')}
        title={links.email ? `Email ${links.email}` : 'No email'}
        aria-label="Send via email"
        disabled={!links.mailto}
        onClick={() => links.mailto && openChannel(links.mailto)}
      >
        <Mail className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/** UI-only send picker. Channel clicks open the device share/link; sending backend comes later. */
export function SendQuotationDialog({ open, onOpenChange, quotationId, customer }: Props) {
  const display = customer.display || customer.name || 'Customer';
  const links = quotationSendLinks(quotationId, customer);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send to Customer</DialogTitle>
          <DialogDescription>
            Uses the customer on this quotation. WhatsApp and SMS need a phone number; email
            needs an address.
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-xl border border-border/70 p-3 text-sm">
          <p className="font-medium">{display}</p>
          {customer.name && customer.name !== display ? (
            <p className="text-xs text-muted-foreground">{customer.name}</p>
          ) : null}
          <p className="mt-2 text-muted-foreground">{links.email || 'No email on file'}</p>
          <p className="text-muted-foreground">{links.phone || 'No phone on file'}</p>
        </div>
        <div className="flex gap-2">
          <ChannelButton
            label="WhatsApp"
            description={links.phone ? links.phone : 'Needs a phone number'}
            disabled={!links.whatsapp}
            className="bg-[#25D366]"
            onClick={() => links.whatsapp && openChannel(links.whatsapp)}
          >
            <WhatsAppIcon className="h-5 w-5" />
          </ChannelButton>
          <ChannelButton
            label="SMS"
            description={links.phone ? links.phone : 'Needs a phone number'}
            disabled={!links.sms}
            className="bg-sky-600"
            onClick={() => links.sms && openChannel(links.sms)}
          >
            <MessageSquareText className="h-5 w-5" />
          </ChannelButton>
          <ChannelButton
            label="Email"
            description={links.email || 'Needs an email'}
            disabled={!links.mailto}
            className="bg-primary"
            onClick={() => links.mailto && openChannel(links.mailto)}
          >
            <Mail className="h-5 w-5" />
          </ChannelButton>
        </div>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
}
