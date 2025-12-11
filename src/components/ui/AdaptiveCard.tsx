import * as React from "react"
import { cn } from "@/lib/utils"
import { useAdaptiveBackground } from "./AdaptiveBackground"

/**
 * AdaptiveCard Component
 * 
 * Card con glassmorphism condicional basado en el Tier del dispositivo.
 * 
 * - LOW Tier: Fondo sólido (bg-slate-900)
 * - MID Tier: Glassmorphism moderado (bg-black/30 backdrop-blur-md)
 * - HIGH Tier: Glassmorphism premium (bg-black/40 backdrop-blur-xl)
 */

interface AdaptiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

const AdaptiveCard = React.forwardRef<HTMLDivElement, AdaptiveCardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const { tier, isLow, isMid, isHigh } = useAdaptiveBackground();

    // Determinar clases basadas en Tier
    const adaptiveClasses = React.useMemo(() => {
      if (isLow) {
        // LOW Tier: Fondo sólido sin glassmorphism
        return 'bg-slate-900 border border-slate-700';
      }

      if (isMid) {
        // MID Tier: Glassmorphism moderado
        return 'bg-black/30 backdrop-blur-md border border-white/10';
      }

      // HIGH Tier: Glassmorphism premium
      return 'bg-black/40 backdrop-blur-xl border border-white/20';
    }, [tier, isLow, isMid, isHigh]);

    // Clases específicas por variante
    const variantClasses = {
      default: 'rounded-lg shadow-sm',
      elevated: 'rounded-xl shadow-2xl',
      outlined: 'rounded-lg border-2',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'text-card-foreground transition-all duration-300',
          adaptiveClasses,
          variantClasses[variant],
          className
        )}
        data-tier={tier}
        {...props}
      />
    );
  }
);
AdaptiveCard.displayName = "AdaptiveCard"

const AdaptiveCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
AdaptiveCardHeader.displayName = "AdaptiveCardHeader"

const AdaptiveCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
AdaptiveCardTitle.displayName = "AdaptiveCardTitle"

const AdaptiveCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-white/70", className)}
    {...props}
  />
))
AdaptiveCardDescription.displayName = "AdaptiveCardDescription"

const AdaptiveCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
AdaptiveCardContent.displayName = "AdaptiveCardContent"

const AdaptiveCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
AdaptiveCardFooter.displayName = "AdaptiveCardFooter"

export {
  AdaptiveCard,
  AdaptiveCardHeader,
  AdaptiveCardFooter,
  AdaptiveCardTitle,
  AdaptiveCardDescription,
  AdaptiveCardContent,
}
