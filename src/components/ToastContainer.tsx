import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { ToastMessage, ToastType } from "../utils/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleNewToast = (event: Event) => {
      const customEvent = event as CustomEvent<ToastMessage>;
      const newToast = customEvent.detail;
      
      setToasts((prev) => [...prev, newToast]);

      // Auto remove after duration
      const duration = newToast.duration || 4000;
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
      }, duration);
    };

    window.addEventListener("system-alert-toast", handleNewToast);
    return () => {
      window.removeEventListener("system-alert-toast", handleNewToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case "success":
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case "error":
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case "info":
        default:
        return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
    }
  };

  const getBorderColor = (type: ToastType) => {
    switch (type) {
      case "success":
        return "border-emerald-500/20 bg-emerald-50/90 dark:bg-[#064e3b]/90 text-emerald-900 dark:text-emerald-100";
      case "error":
        return "border-rose-500/20 bg-rose-50/90 dark:bg-[#4c0519]/90 text-rose-900 dark:text-rose-100";
      case "warning":
        return "border-amber-500/20 bg-amber-50/90 dark:bg-[#78350f]/90 text-amber-900 dark:text-amber-100";
      case "info":
      default:
        return "border-blue-500/20 bg-blue-50/90 dark:bg-[#1e3a8a]/90 text-blue-900 dark:text-blue-100";
    }
  };

  return (
    <div 
      id="global-toast-container" 
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.15 } }}
            className={`pointer-events-auto flex gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-2xl ${getBorderColor(toast.type)} relative overflow-hidden`}
          >
            {/* Top tiny progress line */}
            <motion.div 
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
              className={`absolute top-0 left-0 h-1 ${
                toast.type === "success" ? "bg-emerald-500" :
                toast.type === "error" ? "bg-rose-500" :
                toast.type === "warning" ? "bg-amber-500" : "bg-blue-500"
              }`}
            />

            <div className="pt-0.5">{getIcon(toast.type)}</div>
            
            <div className="flex-1 pr-6">
              {toast.title && (
                <h4 className="text-xs font-black tracking-wide uppercase opacity-85 mb-0.5 leading-tight">
                  {toast.title}
                </h4>
              )}
              <p className="text-xs font-semibold leading-relaxed">
                {toast.message}
              </p>
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="absolute top-3 right-3 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors opacity-60 hover:opacity-100 cursor-pointer text-current"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
