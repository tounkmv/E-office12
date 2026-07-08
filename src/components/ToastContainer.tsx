import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Sparkles } from "lucide-react";
import { ToastMessage, ToastType } from "../utils/toast";

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [language, setLanguage] = useState<"lo" | "en">("lo");

  useEffect(() => {
    // Keep language in sync with localStorage
    const syncLang = () => {
      const stored = localStorage.getItem("office-lang") as "lo" | "en";
      if (stored) {
        setLanguage(stored);
      }
    };
    syncLang();

    const handleNewToast = (event: Event) => {
      syncLang(); // Refresh lang preference on new toast
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
        return <CheckCircle2 className="w-8 h-8 text-emerald-500 animate-bounce" />;
      case "error":
        return <XCircle className="w-8 h-8 text-rose-500 animate-shake" />;
      case "warning":
        return <AlertTriangle className="w-8 h-8 text-amber-500 animate-pulse" />;
      case "info":
      default:
        return <Info className="w-8 h-8 text-indigo-500" />;
    }
  };

  const getThemeStyles = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          glow: "shadow-[0_20px_50px_rgba(16,185,129,0.35)]",
          border: "border-emerald-500/40",
          accentBg: "bg-emerald-500/10",
          accentText: "text-emerald-500 dark:text-emerald-400",
          progressBg: "bg-emerald-500",
          bgGrad: "from-white to-emerald-50/20 dark:from-slate-950 dark:to-emerald-950/10",
          buttonBg: "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 hover:shadow-emerald-500/35",
          defaultTitleLao: "ດໍາເນີນການສໍາເລັດ!",
          defaultTitleEng: "Successful!",
        };
      case "error":
        return {
          glow: "shadow-[0_20px_50px_rgba(244,63,94,0.35)]",
          border: "border-rose-500/40",
          accentBg: "bg-rose-500/10",
          accentText: "text-rose-500 dark:text-rose-400",
          progressBg: "bg-rose-500",
          bgGrad: "from-white to-rose-50/20 dark:from-slate-950 dark:to-rose-950/10",
          buttonBg: "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20 hover:shadow-rose-500/35",
          defaultTitleLao: "ເກີດຂໍ້ຜິດພາດ!",
          defaultTitleEng: "Error Occurred!",
        };
      case "warning":
        return {
          glow: "shadow-[0_20px_50px_rgba(245,158,11,0.35)]",
          border: "border-amber-500/40",
          accentBg: "bg-amber-500/10",
          accentText: "text-amber-500 dark:text-amber-400",
          progressBg: "bg-amber-500",
          bgGrad: "from-white to-amber-50/20 dark:from-slate-950 dark:to-amber-950/10",
          buttonBg: "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-500/20 hover:shadow-amber-500/35",
          defaultTitleLao: "ຄໍາເຕືອນຈາກລະບົບ!",
          defaultTitleEng: "System Warning!",
        };
      case "info":
      default:
        return {
          glow: "shadow-[0_20px_50px_rgba(99,102,241,0.35)]",
          border: "border-indigo-500/40",
          accentBg: "bg-indigo-500/10",
          accentText: "text-indigo-500 dark:text-indigo-400",
          progressBg: "bg-indigo-500",
          bgGrad: "from-white to-indigo-50/20 dark:from-slate-950 dark:to-indigo-950/10",
          buttonBg: "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 hover:shadow-indigo-500/35",
          defaultTitleLao: "ແຈ້ງເຕືອນຈາກລະບົບ!",
          defaultTitleEng: "Notification!",
        };
    }
  };

  const isLao = language === "lo";

  return (
    <div 
      id="global-toast-container" 
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center pointer-events-none p-4"
    >
      <AnimatePresence>
        {toasts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-md pointer-events-auto cursor-pointer"
            onClick={() => setToasts([])}
          />
        )}
      </AnimatePresence>

      <div className="relative w-full max-w-sm flex flex-col gap-4 z-10 items-center justify-center">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast, index) => {
            const styles = getThemeStyles(toast.type);
            const displayTitle = toast.title || (isLao ? styles.defaultTitleLao : styles.defaultTitleEng);
            const dismissText = isLao ? "ຕົກລົງ" : "OK";

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  scale: index === toasts.length - 1 ? 1 : 0.95, 
                  y: 0,
                  zIndex: index,
                  style: index !== toasts.length - 1 ? { transform: `translateY(${(toasts.length - 1 - index) * -8}px) scale(${1 - (toasts.length - 1 - index) * 0.05})`, filter: 'brightness(0.85)' } : {}
                }}
                exit={{ opacity: 0, scale: 0.8, y: -30, transition: { duration: 0.2 } }}
                className={`pointer-events-auto flex flex-col w-full rounded-3xl border ${styles.border} bg-gradient-to-b ${styles.bgGrad} backdrop-blur-2xl p-6 text-center ${styles.glow} relative overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Visual Accent Top Line */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${styles.progressBg}`} />

                {/* Top Corner Dismiss Button */}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Dynamic/Sparkle Glow Accent */}
                <div className="absolute top-12 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent blur-xl pointer-events-none" />

                {/* Icon Container with concentric glowing rings */}
                <div className="mx-auto mt-2 mb-4 relative flex items-center justify-center">
                  <div className={`absolute w-16 h-16 rounded-full ${styles.accentBg} animate-ping opacity-45`} />
                  <div className={`w-14 h-14 rounded-full ${styles.accentBg} border border-white/15 dark:border-white/5 flex items-center justify-center shadow-inner relative z-10`}>
                    {getIcon(toast.type)}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2 mb-5">
                  <h3 className="text-base sm:text-lg font-black tracking-wide text-slate-950 dark:text-white uppercase">
                    {displayTitle}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300 px-1">
                    {toast.message}
                  </p>
                </div>

                {/* Divider Line */}
                <div className="w-full h-px bg-slate-200/60 dark:bg-white/5 mb-4" />

                {/* Interactive Bottom Actions */}
                <div className="flex flex-col gap-2 relative z-10">
                  <button
                    onClick={() => removeToast(toast.id)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black tracking-wider uppercase transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${styles.buttonBg}`}
                  >
                    <span>{dismissText}</span>
                  </button>
                </div>

                {/* Floating Bottom Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100 dark:bg-white/5">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: (toast.duration || 4000) / 1000, ease: "linear" }}
                    className={`h-full ${styles.progressBg}`}
                  />
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

