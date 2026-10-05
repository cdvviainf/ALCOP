"use client"

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox"
import { Check } from "lucide-react"
import { cn } from "cn"

/**
 * Checkbox ALCOP — cuadrado redondeado.
 * Marcado: relleno naranja (--primary) con check blanco.
 * Sin marcar: borde gris, fondo blanco.
 */
function Checkbox({
  className,
  ...props
}: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "peer flex size-5 shrink-0 items-center justify-center rounded-[6px] border border-input bg-white text-primary-foreground transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/40",
        "data-[checked]:border-primary data-[checked]:bg-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="size-3.5" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }
