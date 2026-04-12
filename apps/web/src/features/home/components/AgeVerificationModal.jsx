import { useTranslation } from "../../../shared/i18n/useTranslation.js";

export function AgeVerificationModal({ isOpen, onConfirm }) {
  const { language } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-pb-primary via-pb-accent to-pb-primary"></div>
        
        {/* Icon */}
        <div className="mb-6">
          <div className="w-20 h-20 mx-auto bg-pb-primary/10 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-pb-primary">shield_person</span>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          {language === "en" ? "Age Verification" : "Verificación de Edad"}
        </h2>

        {/* Description */}
        <p className="text-slate-600 mb-6 leading-relaxed">
          {language === "en" 
            ? "This website contains products for adults only. You must be 18 years or older to continue." 
            : "Este sitio web contiene productos solo para adultos. Debes ser mayor de 18 años para continuar."
          }
        </p>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-amber-800">
            {language === "en"
              ? "⚠️ By clicking confirm, you certify that you are of legal age."
              : "⚠️ Al hacer click en confirmar, certificas que eres mayor de edad."
            }
          </p>
        </div>

        {/* Confirm Button */}
        <button
          onClick={onConfirm}
          className="w-full bg-pb-primary hover:bg-pb-primary/90 text-white font-bold py-4 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
        >
          {language === "en" ? "I'm 18 or Older" : "Soy Mayor de 18 Años"}
        </button>

        {/* Footer note */}
        <p className="text-xs text-slate-400 mt-4">
          {language === "en"
            ? "This confirmation will be remembered on this device."
            : "Esta confirmación será recordada en este dispositivo."
          }
        </p>
      </div>
    </div>
  );
}
