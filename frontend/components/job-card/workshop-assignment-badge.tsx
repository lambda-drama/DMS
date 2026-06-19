'use client';

import { Badge } from '@/components/ui/badge';
import { UserCheck } from 'lucide-react';

export function WorkshopAssignmentBadge() {
  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-[#1E88E5]/30 bg-[#1E88E5]/10 text-[#1E88E5]"
    >
      <UserCheck className="h-3.5 w-3.5" />
      Workshop assigned
    </Badge>
  );
}
