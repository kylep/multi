import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

// shadcn/ui-style Button, owned and wired to the Terminal design tokens
// (bg-accent / text-on-accent / border-border, etc.) instead of raw palette
// classes. Variants/sizes via class-variance-authority; `asChild` renders a
// Radix Slot so it can wrap an <a>.
const buttonVariants = cva(
  // Base includes an explicit bg/border/appearance reset: Tailwind preflight
  // is omitted during MUI coexistence, so a bare <button> would otherwise
  // keep its user-agent background/border (visible on the no-fill variants).
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-mono font-semibold cursor-pointer appearance-none bg-transparent border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-on-accent hover:bg-accent-hover',
        secondary: 'bg-surface text-default border border-border hover:bg-raised',
        ghost: 'text-default hover:bg-surface',
        danger: 'bg-danger text-on-accent hover:opacity-90',
        link: 'text-link underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-6 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        // Default a real <button> to type="button"; Slot forwards to its child.
        type={asChild ? undefined : (type ?? 'button')}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
