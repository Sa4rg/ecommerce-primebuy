import { Link } from "react-router-dom";
import { useTranslation } from "../../shared/i18n/useTranslation.js";
import heroCameraImg from "../../assets/hero-camera.png";

export function HomePage() {
  const { t, language } = useTranslation();

  return (
    <main className="bg-pb-bg">

      {/* Hero Section */}
      <section className="relative py-4 md:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="group relative overflow-hidden rounded-3xl shadow-xl border border-pb-border hover:shadow-2xl transition-shadow duration-500">
            {/* Decorative gradient glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-pb-primary/20 via-transparent to-pb-accent/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
            
            <div className="relative h-[400px] md:h-[600px] w-full overflow-hidden">
              <img
                alt={language === "en" ? "Premium electronics and tech" : "Electrónica y tecnología premium"}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={heroCameraImg}
              />
              {/* Overlay with gradient - darkens on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10 group-hover:from-black/80 group-hover:via-black/40 transition-all duration-500 flex flex-col items-center justify-center text-center p-6">
                <h1 className="text-4xl md:text-6xl font-light text-white mb-6 drop-shadow-lg">
                  {language === "en" 
                    ? "Premium Tech, Delivered" 
                    : "Tecnología Premium, Entregada"
                  }
                </h1>
                <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
                  {language === "en"
                    ? "Discover our curated selection of electronics and gadgets"
                    : "Descubre nuestra selección curada de electrónicos y gadgets"
                  }
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/products"
                    className="bg-white hover:bg-pb-primary hover:text-white text-slate-900 px-8 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-300 shadow-lg hover:shadow-pb-primary/30 hover:scale-105"
                  >
                    {language === "en" ? "Shop Now" : "Comprar Ahora"}
                  </Link>
                  <Link
                    to="/support/faq"
                    className="inline-flex items-center text-white border-b border-white hover:text-pb-primary hover:border-pb-primary transition-all py-1 font-medium"
                  >
                    {language === "en" ? "Learn More" : "Más Información"}
                    <span className="material-symbols-outlined ml-2 text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 py-10 border-t border-pb-border">
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
      <section className="bg-pb-surface py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-pb-text mb-4">
            {language === "en" ? "Ready to explore?" : "¿Listo para explorar?"}
          </h2>
          <p className="text-pb-text-secondary mb-8 max-w-2xl mx-auto">
            {language === "en"
              ? "Browse our complete catalog of premium electronics, gadgets, and accessories."
              : "Explora nuestro catálogo completo de electrónicos premium, gadgets y accesorios."
            }
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-pb-primary hover:bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-pb-primary/30 hover:scale-105"
          >
            {language === "en" ? "View All Products" : "Ver Todos los Productos"}
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
