SOBRE EL PROYECTO:
- Tienda online simple con catálogo de productos y carrito de compras
- Stack: React + Javascript + Vite + Tailwind CSS v4
- Testing: Vitest + Testing Library + Playwright (E2E)

METODOLOGÍA DE TRABAJO:

1. TDD (Test-Driven Development): 
   - Siempre escribir el test PRIMERO
   - Verificar que FALLA (Red)
   - Implementar código MÍNIMO para pasar (Green)
   - Refactorizar si es necesario

2. Scope Rule para organización de carpetas:
   - GLOBAL SCOPE (src/shared/): Código usado en múltiples features
     → types/, utils/, constants/, components/, strategies/, hooks/
   - LOCAL SCOPE (src/features/X/): Código específico de una feature
     → product-catalog/, shopping-cart/, auth/
   - Context global: src/context/
   - Infraestructura: src/infrastructure/

3. Verificación continua:
   - Después de cada feature: pnpm test:run && pnpm build
   - Después de E2E (video 7+): agregar pnpm test:e2e
   - Al final: pnpm verify (lint + typecheck + tests + e2e + build)

   ## Paso 4: Estructura de Carpetas (The Scope Rule)

### Concepto: La Regla del Scope

Organizamos el código siguiendo el mismo concepto de **scope** de JavaScript:

```javascript
// Global Scope - disponible en toda la app
let globalVariable = 'Available everywhere';

// Local Scope - solo disponible en su contexto
function localContext() {
  let localVariable = 'Available only here';
}
```

**Aplicado a la arquitectura:**

| Tipo | Ubicación | Visibilidad | Ejemplos |
|------|-----------|-------------|----------|
| **Global Scope** | `src/shared/` | Toda la app | Button, Modal, formatPrice, types |
| **Local Scope** | `src/features/X/` | Solo en feature X | ProductCard, CartItem, CartService |

**Beneficios:**
- 🧩 **Modularidad**: Cada feature es independiente
- ♻️ **Reuso eficiente**: Componentes globales sin redundancia
- ⚡ **Lazy loading**: Features locales se cargan solo cuando se necesitan
- 🔍 **Claridad**: Sabes dónde buscar cada cosa



### Estructura Resultante (lo que queremos)

```
src/
├── shared/                    # 🌍 GLOBAL SCOPE
│   ├── types/
│   │   └── index.js          # Product, CartItem
│   ├── utils/
│   │   └── index.js          # formatPrice, calculateSubtotal
│   ├── constants/
│   │   └── businessRules.js  # Reglas de negocio
│   ├── components/
│   │   └── index.js          # Button, Skeleton, Toast
│   └── hooks/
│       └── index.js          # useLocalStorage, etc.
│
├── features/                  # 📦 LOCAL SCOPE
│   ├── product-catalog/
│   │   ├── components/
│   │   │   ├── ProductCard.tsx
│   │   │   └── ProductCard.test.tsx
│   │   └── ProductCatalog.tsx
│   │
│   └── shopping-cart/
│       ├── components/
│       │   ├── CartItem.tsx
│       │   └── CartSummary.tsx
│       └── ShoppingCart.tsx
│
├── context/                   # 🔄 ESTADO GLOBAL
│   └── CartContext.tsx
│
├── infrastructure/            # 🔧 SERVICIOS EXTERNOS
│   └── sentry.js
│
└── test/                      # 🧪 CONFIG DE TESTS
    └── setup.js
```

### Regla Simple para Decidir

> **¿Lo usa más de una feature?** → `shared/` (Global Scope)
> 
> **¿Solo lo usa una feature?** → `features/X/` (Local Scope)

---