/**
 * Guest Tooltip Button Component
 * Button that shows tooltip when disabled for guests
 */

'use client';

import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface GuestTooltipButtonProps extends ButtonProps {
  isGuest: boolean;
  guestTooltip?: string;
}

export function GuestTooltipButton({
  isGuest,
  guestTooltip = 'Not allowed for guests',
  disabled,
  children,
  className,
  ...props
}: GuestTooltipButtonProps) {
  const isDisabled = disabled || isGuest;

  if (isGuest) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={cn('inline-flex', className?.includes('flex-1') && 'flex-1', className?.includes('w-full') && 'w-full')}>
              <Button {...props} className={cn(className, 'w-full')} disabled={isDisabled}>
                {children}
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>{guestTooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Button {...props} className={className} disabled={isDisabled}>
      {children}
    </Button>
  );
}
