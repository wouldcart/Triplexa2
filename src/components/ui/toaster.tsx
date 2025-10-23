
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts && toasts
        .filter(toast => {
          // Filter out auto-save related toast messages
          const titleStr = typeof toast.title === 'string' ? toast.title : '';
          const descStr = typeof toast.description === 'string' ? toast.description : '';
          
          // Skip draft saved and auto-save messages
          if (titleStr.toLowerCase().includes('draft saved') || 
              titleStr.toLowerCase().includes('auto-save') ||
              descStr.toLowerCase().includes('draft has been saved')) {
            return false;
          }
          
          return true;
        })
        .map(function ({ id, title, description, action, ...props }) {
        // Create a clean copy of props without problematic properties
        const { variant, type, ...toastProps } = props || {};
        
        // Set the correct className based on variant
        let className = toastProps.className || "";
        if (variant === "success") {
          className = "bg-green-500 text-white border-none";
        } else if (variant === "destructive") {
          className = "bg-destructive text-destructive-foreground border-destructive";
        }
        
        // Apply the className
        toastProps.className = className;

        return (
          <Toast key={id} {...toastProps}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
