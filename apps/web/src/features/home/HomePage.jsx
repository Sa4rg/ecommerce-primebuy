import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/i18n/useTranslation.js";

export function HomePage() {
  const { t, language } = useTranslation();

  return (
    <main className="bg-pb-bg">

      {/* Hero Section */}
      <section className="relative py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="group relative overflow-hidden rounded-3xl shadow-xl border border-pb-border hover:shadow-2xl transition-shadow duration-500 bg-pb-bg-subtle">
            {/* Decorative gradient glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pb-primary/20 via-transparent to-pb-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            
            <div className="relative h-[300px] xs:h-[360px] sm:h-[400px] md:h-[500px] w-full flex flex-col items-start justify-center px-6 xs:px-10 sm:px-16 md:px-20">
              {/* Title with decorative line */}
              <div className="mb-6 xs:mb-8">
                <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-extrabold text-pb-text mb-2">
                  PrimeBuy
                </h1>
                <div className="h-1 w-32 xs:w-40 sm:w-48 bg-pb-primary rounded-full" />
              </div>

              {/* Subtitle */}
              <h2 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-bold text-pb-text mb-3 xs:mb-4 max-w-2xl uppercase leading-tight">
                {language === "en" 
                  ? "Your Premium Destination for Cutting-Edge Electronics." 
                  : "Tu Destino Premium para Electrónica de Vanguardia."
                }
              </h2>

              {/* Description */}
              <p className="text-sm xs:text-base sm:text-lg text-pb-text-secondary mb-6 xs:mb-8 max-w-xl">
                {language === "en"
                  ? "Quality, innovation and trust in every purchase."
                  : "Calidad, innovación y confianza en cada compra."
                }
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col xxs:flex-row gap-3 xs:gap-4 w-full xxs:w-auto">
                <Link
                  to="/products"
                  className="bg-pb-primary hover:bg-pb-primary-hover text-white px-6 xs:px-8 py-3 xs:py-3.5 rounded-lg text-sm xs:text-base font-bold uppercase tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 text-center"
                >
                  {language === "en" ? "Shop Now" : "Comprar Ahora"}
                </Link>
                <Link
                  to="/support/faq"
                  className="bg-white hover:bg-pb-surface-2 text-pb-text border-2 border-pb-text px-6 xs:px-8 py-3 xs:py-3.5 rounded-lg text-sm xs:text-base font-semibold uppercase tracking-wide transition-all duration-300 text-center"
                >
                  {language === "en" ? "Learn More" : "Más Información"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 xs:pb-16 sm:pb-20">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 xs:gap-5 sm:gap-6 py-6 xs:py-8 sm:py-10 border-t border-pb-border">
          {/* Free Shipping */}
          <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-pb-surface transition-colors duration-300 cursor-default">
            <span className="material-symbols-outlined text-pb-primary text-2xl group-hover:scale-110 transition-transform duration-300">local_shipping</span>
            <div>
              <h4 className="font-bold text-sm text-pb-text">
                {language === "en" ? "Free Shipping" : "Envío Gratis"}
              </h4>
              <p className="text-xs text-pb-text-secondary mt-1">
                {language === "en" 
                  ? "On orders over $150. Fast & reliable." 
                  : "En pedidos mayores a $150. Rápido y confiable."
                }
              </p>
            </div>
          </div>

          {/* 2-Year Warranty */}
          <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-pb-surface transition-colors duration-300 cursor-default">
            <span className="material-symbols-outlined text-pb-primary text-2xl group-hover:scale-110 transition-transform duration-300">verified</span>
            <div>
              <h4 className="font-bold text-sm text-pb-text">
                {language === "en" ? "4 months Warranty per fabric defects" : "Garantía de 4 meses por defectos de fabricación"}
              </h4>
              <p className="text-xs text-pb-text-secondary mt-1">
                {language === "en" 
                  ? "Peace of mind with every purchase." 
                  : "Tranquilidad con cada compra."
                }
              </p>
            </div>
          </div>

          {/* Support */}
          <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-pb-surface transition-colors duration-300 cursor-default">
            <span className="material-symbols-outlined text-pb-primary text-2xl group-hover:scale-110 transition-transform duration-300">support_agent</span>
            <div>
              <h4 className="font-bold text-sm text-pb-text">
                {language === "en" ? "Expert Support" : "Soporte Experto"}
              </h4>
              <p className="text-xs text-pb-text-secondary mt-1">
                {language === "en" 
                  ? "WhatsApp support available." 
                  : "Soporte por WhatsApp disponible."
                }
              </p>
              <Link 
                to="/support/faq" 
                className="text-[10px] text-pb-accent font-bold uppercase tracking-tighter hover:underline mt-2 inline-block"
              >
                {language === "en" ? "Learn More" : "Más Info"}
              </Link>
            </div>
          </div>

          {/* Secure Payments */}
          <div className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-pb-surface transition-colors duration-300 cursor-default">
            <span className="material-symbols-outlined text-pb-primary text-2xl group-hover:scale-110 transition-transform duration-300">lock</span>
            <div>
              <h4 className="font-bold text-sm text-pb-text">
                {language === "en" ? "Secure Payments" : "Pagos Seguros"}
              </h4>
              <p className="text-xs text-pb-text-secondary mt-1">
                {language === "en" 
                  ? "Multiple payment methods accepted." 
                  : "Múltiples métodos de pago aceptados."
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories CTA */}
      <section className="bg-pb-surface py-10 xs:py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-pb-text mb-3 xs:mb-4">
            {language === "en" ? "Ready to explore?" : "¿Listo para explorar?"}
          </h2>
          <p className="text-sm xs:text-base text-pb-text-secondary mb-6 xs:mb-8 max-w-2xl mx-auto">
            {language === "en"
              ? "Browse our complete catalog of premium electronics, gadgets, and accessories."
              : "Explora nuestro catálogo completo de electrónicos premium, gadgets y accesorios."
            }
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-pb-primary hover:bg-orange-600 text-white px-6 xs:px-8 py-2.5 xs:py-3 rounded-lg font-semibold text-sm xs:text-base transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-pb-primary/30 hover:scale-105"
          >
            {language === "en" ? "View All Products" : "Ver todos los productos"}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
