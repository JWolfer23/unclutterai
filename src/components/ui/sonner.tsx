import { Toaster as Sonner, toast as sonnerToast } from "sonner"

import { areToastsSuppressed, coerceToastText } from "@/lib/toastSafety"

type ToasterProps = React.ComponentProps<typeof Sonner>

type SonnerToast = typeof sonnerToast

type ToastFn = ((message: any, ...args: any[]) => any) & {
  success: (message: any, ...args: any[]) => any
  error: (message: any, ...args: any[]) => any
  info: (message: any, ...args: any[]) => any
  warning?: (message: any, ...args: any[]) => any
  promise?: (...args: any[]) => any
  dismiss?: (...args: any[]) => any
}

const toast = ((message: any, ...args: any[]) => {
  if (areToastsSuppressed()) return undefined
  return (sonnerToast as any)(coerceToastText(message) ?? "Notification", ...args)
}) as ToastFn

toast.success = (message: any, ...args: any[]) => {
  if (areToastsSuppressed()) return undefined
  return (sonnerToast as any).success(coerceToastText(message) ?? "Success", ...args)
}

toast.error = (message: any, ...args: any[]) => {
  if (areToastsSuppressed()) return undefined
  return (sonnerToast as any).error(coerceToastText(message) ?? "Error", ...args)
}

toast.info = (message: any, ...args: any[]) => {
  if (areToastsSuppressed()) return undefined
  return (sonnerToast as any).info(coerceToastText(message) ?? "Info", ...args)
}

// Preserve any extra helpers sonner exposes (dismiss, promise, etc.)
;(toast as any).dismiss = (sonnerToast as any).dismiss
;(toast as any).promise = (sonnerToast as any).promise

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }

