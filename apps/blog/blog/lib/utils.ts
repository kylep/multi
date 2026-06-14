import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Merge conditional class names, de-duplicating conflicting Tailwind
// utilities (last wins). The standard shadcn/ui helper.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
