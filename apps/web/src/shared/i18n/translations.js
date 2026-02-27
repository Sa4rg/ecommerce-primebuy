// web/src/shared/i18n/translations.js

export const translations = {
  es: {
    navbar: {
      electronics: "Electrónica",
      newArrivals: "Novedades",
      offers: "Ofertas",
      searchPlaceholder: "Buscar productos...",
      cart: "Carrito",
      account: "Cuenta",
      admin: "Admin",
      products: "Productos",
      login: "Ingresar",
      logout: "Salir",
    },

    checkout: {
      title: {
        shippingInfo: "Información de envío",
        deliveryType: "Tipo de entrega",
        paymentMethod: "Método de pago",
        orderSummary: "Resumen del pedido",
      },
      form: {
        fullName: "Nombre completo",
        email: "Correo",
        phone: "Teléfono",
        city: "Ciudad",
        street: "Dirección",
        state: "Estado",
        reference: "Referencia (opcional)",
        pickupHint: "Para Pickup no se requiere dirección completa.",
      },
      placeholders: {
        fullName: "Alexander Wright",
        email: "you@email.com",
        phone: "+58 414 123 4567",
        city: "Caracas",
        street: "Av Principal, Casa #1",
        state: "Carabobo",
        reference: "Near the park",
      },
      methods: {
        shipping: {
          pickup: "Retiro en tienda / Pickup",
          localDelivery: "Delivery",
          nationalShipping: "Envío nacional",
        },
        payment: {
          zelle: "Zelle",
          zinli: "Zinli",
          bankTransfer: "Transferencia Bancaria",
          pagoMovil: "Pago Móvil",
        },
      },
      summary: {
        qty: "Cant.: {qty}",
        subtotal: "Subtotal",
        shipping: "Envío",
        estimatedTaxes: "Impuestos estimados",
        total: "Total",
        free: "GRATIS",
        tbd: "PEND",
        emptyCart: "Tu carrito está vacío.",
        perItemLineTotal: "Total del ítem",
      },
      actions: {
        processing: "Procesando...",
        continueToPayment: "Continuar con el pago",
      },
      errors: {
        checkoutIdMissing: "Falta checkoutId en la URL.",
        noCart: "No se encontró un carrito. Agrega productos primero.",
        emptyCart: "Tu carrito está vacío.",
        incomplete: "Completa tus datos para continuar.",
        failedToLoad: "No se pudo cargar el checkout.",
        paymentIdMissing: "No se recibió paymentId desde /api/payments",
      },
      trust: {
        securePayment: "Pago seguro",
        returns: "Devoluciones 30 días",
      },
    },

    adminProducts: {
      title: "Administrar productos",
      subtitle: "Gestiona el catálogo de productos",

      // ✅ defaults usados por AdminProductsPage
      defaults: {
        general: "General",
      },

      form: {
        // ✅ títulos
        createTitle: "Crear producto",
        editTitle: "Editar producto",

        // ✅ labels
        nameQuick: "Nombre",
        nameES: "Nombre (ES)",
        nameEN: "Nombre (EN)",
        shortDescES: "Descripción corta (ES)",
        shortDescEN: "Descripción corta (EN)",
        price: "Precio (USD)",
        stock: "Stock",
        category: "Categoría",

        // ✅ placeholders + help
        placeholders: {
          name: 'Ej: "Sony A7 IV"',
          nameES: 'Ej: "Cámara Sony A7 IV"',
          nameEN: 'Ej: "Sony A7 IV Camera"',
          shortDescES: "2-3 líneas cortas...",
          shortDescEN: "2-3 short lines...",
          price: "2499",
          stock: "10",
          category: "Ej: Cámaras",
        },
        help: {
          nameQuick: "Este campo sincroniza ES + EN (puedes editarlos después por separado).",
        },

        // 🔁 compat con tus keys anteriores (no rompe)
        name: "Nombre",
        description: "Descripción",
        save: "Guardar",
        cancel: "Cancelar",
        add: "Agregar producto",
        edit: "Editar producto",
      },

      images: {
        title: "Imágenes",
        subtitle: "Pega URLs (cover + galería). Recomendado: HTTPS.",
        preview: "Vista previa",
        noCover: "Sin cover",

        // cover
        coverLabel: "URL de imagen principal (cover)",
        coverPlaceholder: "https://.../cover.jpg",
        coverHelp: "Tip: si no pones cover, se usará la primera imagen de la galería como principal.",

        // gallery
        galleryLabel: "URLs de galería",
        addImage: "+ Agregar imagen",
        emptyGallery: "Aún no hay imágenes en la galería.",
        galleryPlaceholder: "https://.../image-{n}.jpg",
        galleryPreview: "Vista previa de galería",
        noPreview: "No hay imágenes para previsualizar.",

        // action
        useCoverAsFirst: "Usar cover como primera",
        useCoverAsFirstTitle: "Pone el cover como primera imagen en la galería (si no está)",

        // 🔁 compat con tus keys anteriores
        upload: "Subir imagen",
        remove: "Eliminar imagen",
      },

      specs: {
        title: "Especificaciones",
        add: "+ Agregar especificación",
        empty: "Aún no hay especificaciones.",
        labelES: "Label ES (Ej: Sensor)",
        valueES: "Valor ES",
        labelEN: "Label EN (e.g. Sensor)",
        valueEN: "Valor EN",

        // 🔁 compat anterior
        key: "Clave",
        value: "Valor",
        remove: "Eliminar",
      },

      catalog: {
        title: "Catálogo",
        searchPlaceholder: "Buscar productos...",
        sortBy: "Ordenar por:",
        sort: {
          name: "Nombre",
          price: "Precio",
          stock: "Stock",
        },

        // 🔁 compat con tus keys anteriores
        search: "Buscar por nombre o categoría...",
      },

      table: {
        id: "ID",
        product: "Producto",
        category: "Categoría",
        price: "Precio",
        stock: "Stock",
        actions: "Acciones",

        // 🔁 compat anterior
        name: "Nombre",
        edit: "Editar",
        delete: "Eliminar",
      },

      pagination: {
        prev: "Anterior",
        next: "Siguiente",
        showing: "Mostrando {shown} de {total} productos",
      },

      states: {
        loading: "Cargando productos...",
        errorTitle: "Error",
        empty: "No hay productos para mostrar.",
      },

      errors: {
        load: "No se pudieron cargar los productos",
        save: "No se pudo guardar el producto",
        delete: "No se pudo eliminar el producto",
        formInvalid: "Por favor completa nombre, precio y stock.",

        // 🔁 compat anterior
        required: "Este campo es obligatorio",
        invalidPrice: "Precio inválido",
        invalidStock: "Stock inválido",
        saveFailed: "No se pudo guardar el producto",
        loadFailed: "No se pudieron cargar los productos",
      },

      actions: {
        new: "Nuevo",
        refresh: "Actualizar",
        create: "Crear producto",
        save: "Guardar cambios",
        saving: "Guardando...",
        cancel: "Cancelar",
        edit: "Editar",
        delete: "Eliminar",
        deleting: "Eliminando...",
        remove: "Quitar",

        // 🔁 compat anterior
        add: "Agregar",
      },

      confirm: {
        // ✅ ahora acepta {name}
        delete: '¿Seguro que quieres eliminar "{name}"? Esto no se puede deshacer.',
      },
    },

    productCard: {
      favorite: "Favorito",
      stock: {
        available: "Disponible",
        out: "Sin stock",
      },
      actions: {
        addToCart: "Agregar al carrito",
        adding: "Agregando...",
      },
      category: {
        general: "General",
      },
      errors: {
        insufficientStock: "Stock insuficiente",
        unknown: "Error desconocido",
      },
    },

    productCatalog: {
      breadcrumbs: {
        home: "Home",
        electronics: "Electrónica",
      },
      sidebar: {
        categories: "Categorías",
        all: "Todos",
        watches: "Relojes",
        securityCameras: "Cámaras de seguridad",
        priceRange: "Rango de precios",
        minPrice: "Precio mín.",
        maxPrice: "Precio máx.",
        resetPrice: "Resetear precio",
      },
      header: {
        titleElectronics: "Electrónica",
        showing: "Mostrando {showing} de {total} productos",
      },
      controls: {
        favorites: "Favoritos",
        sortNewest: "Ordenar: Más nuevos",
        sortPriceAsc: "Precio: Menor a Mayor",
        sortPriceDesc: "Precio: Mayor a Menor",
        sortStockDesc: "Stock: Mayor a Menor",
      },
      states: {
        loading: "Cargando productos...",
        errorTitle: "Error",
        emptyTitle: "No se encontraron productos.",
        emptyHint: "Prueba con otro filtro o categoría.",
      },
      pagination: {
        prev: "Página anterior",
        next: "Página siguiente",
      },
    },

    cart: {
      breadcrumb: {
        home: "Home",
        cart: "Carrito",
      },
      title: "Carrito de compras",
      itemsCount: "{count} artículo{plural} en tu carrito",
      continueShopping: "Seguir comprando",
      loading: "Cargando carrito...",
      inactive: {
        title: "Este carrito ya no está activo.",
        description: "Se usó en un checkout/pago. Inicia un carrito nuevo para comprar otra vez.",
        cta: "Iniciar un carrito nuevo",
      },
      empty: {
        title: "Tu carrito está vacío.",
        cta: "Ver productos →",
      },
      item: {
        productId: "ID del producto",
        qty: "Cant.",
        decrease: "Disminuir cantidad",
        increase: "Aumentar cantidad",
        remove: "Eliminar",
        removeAria: "Eliminar {name}",
      },
      summary: {
        title: "Resumen del pedido",
        subtotal: "Subtotal",
        taxes: "Impuestos",
        total: "Total",
        checkout: "Checkout",
        securePayments: "Pagos seguros",
        shippingInfoTitle: "Opciones de envío disponibles",
        shippingInfoBody: "Las opciones se calculan en el checkout.",
        proceedToCheckout: "Ir al checkout",
      },
      error: {
        title: "Algo salió mal.",
      },
      sessionExpired: {
        title: "Sesión expirada",
        description: "Tu sesión expiró. Este carrito estaba asociado a tu cuenta.",
        youCan: "Puedes:",
        login: "Ingresar",
        loginHint: "para recuperar tu carrito",
        continueGuest: "Continuar como invitado",
        continueGuestHint: "con un carrito nuevo vacío",
      },
    },

    auth: {
      common: {
        emailLabel: "Correo electrónico",
        passwordLabel: "Contraseña",
        confirmPasswordLabel: "Confirmar contraseña",
        backToLogin: "Volver al login",
        continueWith: "O continuar con",
        continueWithGoogle: "Continuar con Google",
        showPassword: "Mostrar contraseña",
        hidePassword: "Ocultar contraseña",
      },
      login: {
        title: "Bienvenida de vuelta",
        subtitle: "Inicia sesión en tu cuenta de ElectroVar",
        forgotPassword: "¿Olvidaste tu contraseña?",
        signIn: "Iniciar sesión",
        signingIn: "Iniciando...",
        noAccount: "¿No tienes una cuenta?",
        createAccount: "Crear cuenta",
        errorTitle: "Algo salió mal",
        defaultError: "Falló el inicio de sesión",
      },
      register: {
        title: "Crear cuenta",
        subtitle: "Crea tu cuenta de ElectroVar",
        nameLabel: "Nombre (opcional)",
        namePlaceholder: "Tu nombre",
        signUp: "Crear cuenta",
        signingUp: "Creando...",
        haveAccount: "¿Ya tienes cuenta?",
        goToLogin: "Ir al login",
        errorTitle: "Algo salió mal",
        defaultError: "Falló el registro",
        emailLabel: "Correo electrónico",
        emailPlaceholder: "name@company.com",
        passwordLabel: "Contraseña",
        passwordPlaceholder: "••••••••",
        confirmPasswordLabel: "Confirmar contraseña",
        confirmPasswordPlaceholder: "••••••••",
        showPassword: "Mostrar contraseña",
        hidePassword: "Ocultar contraseña",
        mismatch: "Las contraseñas no coinciden.",
      },
      forgot: {
        title: "Olvidé mi contraseña",
        subtitle: "Te enviaremos un código para resetear tu contraseña.",
        sendCode: "Enviar código",
        sending: "Enviando...",
        successTitle: "Revisa tu email",
        successBody: "Si el email existe, enviamos un código de verificación.",
        iHaveCode: "Tengo un código",
        backToLogin: "Volver al login",
        checkEmail: "Revisa tu email",
        emailSent: "Si el email existe, enviamos un código de verificación.",
        errorTitle: "Algo salió mal",
        defaultError: "Falló la solicitud",
      },
      reset: {
        title: "Resetear contraseña",
        subtitle: "Ingresa el código del email y elige una nueva contraseña.",
        codeLabel: "Código",
        codePlaceholder: "123456",
        newPasswordLabel: "Nueva contraseña",
        confirmPasswordLabel: "Confirmar contraseña",
        mismatch: "Las contraseñas no coinciden.",
        resetPassword: "Resetear contraseña",
        resetBtn: "Resetear contraseña",
        resetting: "Reseteando...",
        needCode: "¿Necesitas un código?",
        errorTitle: "Algo salió mal",
        defaultError: "Falló el reseteo",
      },
      callback: {
        signingIn: "Iniciando sesión...",
        failedTitle: "Falló la autenticación",
        defaultError: "Falló el login con Google",
      },
    },

    productDetail: {
      breadcrumbs: { home: "Home", products: "Products" },
      stock: { available: "Disponible", out: "Sin stock" },
      actions: {
        addToCart: "Agregar al carrito",
        adding: "Agregando...",
        added: "Agregado ✓",
        // buyNow ya no lo usas, pero si existe no molesta
        buyNow: "Comprar ahora",
      },
      perks: {
        shipping: "Envío nacional",
        returns: "30 días de devolución",
      },
      specs: {
        title: "Especificaciones técnicas",
        empty: "Este producto no tiene especificaciones aún.",
        downloadPdf: "Descargar PDF completo",
      },
      states: {
        loading: "Cargando producto...",
        errorTitle: "Algo salió mal",
        backToCatalog: "Volver al catálogo",
      },
    },
  },

  en: {
    navbar: {
      electronics: "Electronics",
      newArrivals: "New Arrivals",
      offers: "Offers",
      searchPlaceholder: "Search products...",
      cart: "Cart",
      account: "Account",
      admin: "Admin",
      products: "Products",
      login: "Login",
      logout: "Logout",
    },

    checkout: {
      title: {
        shippingInfo: "Shipping Information",
        deliveryType: "Delivery Type",
        paymentMethod: "Payment Method",
        orderSummary: "Order Summary",
      },
      form: {
        fullName: "Full Name",
        email: "Email",
        phone: "Phone Number",
        city: "City",
        street: "Street Address",
        state: "State",
        reference: "Reference (optional)",
        pickupHint: "Pickup does not require a full address.",
      },
      placeholders: {
        fullName: "Alexander Wright",
        email: "you@email.com",
        phone: "+58 414 123 4567",
        city: "Caracas",
        street: "Av Principal, Casa #1",
        state: "Carabobo",
        reference: "Near the park",
      },
      methods: {
        shipping: {
          pickup: "Store pickup",
          localDelivery: "Delivery",
          nationalShipping: "National shipping",
        },
        payment: {
          zelle: "Zelle",
          zinli: "Zinli",
          bankTransfer: "Bank transfer",
          pagoMovil: "Pago Móvil",
        },
      },
      summary: {
        qty: "Qty: {qty}",
        subtotal: "Subtotal",
        shipping: "Shipping",
        estimatedTaxes: "Estimated Taxes",
        total: "Total",
        free: "FREE",
        tbd: "TBD",
        emptyCart: "Your cart is empty.",
        perItemLineTotal: "Item total",
      },
      actions: {
        processing: "Processing...",
        continueToPayment: "Continue to payment",
      },
      errors: {
        checkoutIdMissing: "checkoutId missing in URL.",
        noCart: "No cart found. Please add items first.",
        emptyCart: "Your cart is empty.",
        incomplete: "Please complete your details to continue.",
        failedToLoad: "Failed to load checkout.",
        paymentIdMissing: "No paymentId returned from /api/payments",
      },
      trust: {
        securePayment: "Secure payment",
        returns: "30-day returns",
      },
    },

    adminProducts: {
      title: "Manage products",
      subtitle: "Manage the product catalog",

      defaults: {
        general: "General",
      },

      form: {
        createTitle: "Create product",
        editTitle: "Edit product",

        nameQuick: "Name",
        nameES: "Name (ES)",
        nameEN: "Name (EN)",
        shortDescES: "Short description (ES)",
        shortDescEN: "Short description (EN)",
        price: "Price (USD)",
        stock: "Stock",
        category: "Category",

        placeholders: {
          name: 'e.g. "Sony A7 IV"',
          nameES: 'e.g. "Sony A7 IV Camera"',
          nameEN: 'e.g. "Sony A7 IV Camera"',
          shortDescES: "2-3 short lines...",
          shortDescEN: "2-3 short lines...",
          price: "2499",
          stock: "10",
          category: "e.g. Cameras",
        },
        help: {
          nameQuick: "This field syncs ES + EN (you can edit them separately below).",
        },

        // compat anterior
        name: "Name",
        price: "Price",
        category: "Category",
        description: "Description",
        save: "Save",
        cancel: "Cancel",
        add: "Add product",
        edit: "Edit product",
      },

      images: {
        title: "Images",
        subtitle: "Paste URLs (cover + gallery). Recommended: HTTPS.",
        preview: "Preview",
        noCover: "No cover",

        coverLabel: "Cover image URL",
        coverPlaceholder: "https://.../cover.jpg",
        coverHelp: "Tip: if you don’t set a cover, the first gallery image will be used as the main image.",

        galleryLabel: "Gallery URLs",
        addImage: "+ Add image",
        emptyGallery: "No gallery images yet.",
        galleryPlaceholder: "https://.../image-{n}.jpg",
        galleryPreview: "Gallery preview",
        noPreview: "No images to preview.",

        useCoverAsFirst: "Use cover as first",
        useCoverAsFirstTitle: "Adds the cover as the first gallery image (if it isn’t already).",

        // compat
        upload: "Upload image",
        remove: "Remove image",
      },

      specs: {
        title: "Specifications",
        add: "+ Add spec",
        empty: "No specs yet.",
        labelES: "Label ES (e.g. Sensor)",
        valueES: "Value ES",
        labelEN: "Label EN (e.g. Sensor)",
        valueEN: "Value EN",

        // compat
        key: "Key",
        value: "Value",
        remove: "Remove",
      },

      catalog: {
        title: "Catalog",
        searchPlaceholder: "Search products...",
        sortBy: "Sort by:",
        sort: {
          name: "Name",
          price: "Price",
          stock: "Stock",
        },

        // compat
        search: "Search by name or category...",
      },

      table: {
        id: "ID",
        product: "Product",
        category: "Category",
        price: "Price",
        stock: "Stock",
        actions: "Actions",

        // compat
        name: "Name",
        edit: "Edit",
        delete: "Delete",
      },

      pagination: {
        prev: "Previous",
        next: "Next",
        showing: "Showing {shown} of {total} products",
      },

      states: {
        loading: "Loading products...",
        errorTitle: "Error",
        empty: "No products to display.",
      },

      errors: {
        load: "Failed to load products",
        save: "Failed to save product",
        delete: "Failed to delete product",
        formInvalid: "Please fill name, price and stock.",

        // compat
        required: "This field is required",
        invalidPrice: "Invalid price",
        invalidStock: "Invalid stock",
        saveFailed: "Failed to save product",
        loadFailed: "Failed to load products",
      },

      actions: {
        new: "New",
        refresh: "Refresh",
        create: "Create product",
        save: "Save changes",
        saving: "Saving...",
        cancel: "Cancel",
        edit: "Edit",
        delete: "Delete",
        deleting: "Deleting...",
        remove: "Remove",

        // compat
        add: "Add",
      },

      confirm: {
        delete: 'Delete "{name}"? This cannot be undone.',
      },
    },

    productCard: {
      favorite: "Favorite",
      stock: {
        available: "Available",
        out: "Out of stock",
      },
      actions: {
        addToCart: "Add to cart",
        adding: "Adding...",
      },
      category: {
        general: "General",
      },
      errors: {
        insufficientStock: "Insufficient stock",
        unknown: "Unknown error",
      },
    },

    productCatalog: {
      breadcrumbs: {
        home: "Home",
        electronics: "Electronics",
      },
      sidebar: {
        categories: "Categories",
        all: "All",
        watches: "Watches",
        securityCameras: "Security Cameras",
        priceRange: "Price Range",
        minPrice: "Min price",
        maxPrice: "Max price",
        resetPrice: "Reset price",
      },
      header: {
        titleElectronics: "Electronics",
        showing: "Showing {showing} of {total} products",
      },
      controls: {
        favorites: "Favorites",
        sortNewest: "Sort by: Newest",
        sortPriceAsc: "Price: Low to High",
        sortPriceDesc: "Price: High to Low",
        sortStockDesc: "Stock: High to Low",
      },
      states: {
        loading: "Loading products...",
        errorTitle: "Error",
        emptyTitle: "No products found.",
        emptyHint: "Try another filter or category.",
      },
      pagination: {
        prev: "Previous page",
        next: "Next page",
      },
    },

    cart: {
      breadcrumb: {
        home: "Home",
        cart: "Cart",
      },
      title: "Shopping Cart",
      itemsCount: "{count} item{plural} in your cart",
      continueShopping: "Continue shopping",
      loading: "Loading cart...",
      inactive: {
        title: "This cart is not active anymore.",
        description: "It was used in a checkout/payment. Start a new cart to shop again.",
        cta: "Start a new cart",
      },
      empty: {
        title: "Your cart is empty.",
        cta: "Browse products →",
      },
      item: {
        productId: "Product ID",
        qty: "Qty",
        decrease: "Decrease quantity",
        increase: "Increase quantity",
        remove: "Remove",
        removeAria: "Remove {name}",
      },
      summary: {
        title: "Order summary",
        subtotal: "Subtotal",
        taxes: "Taxes",
        total: "Total",
        checkout: "Checkout",
        securePayments: "Secure payments",
        shippingInfoTitle: "Shipping options available",
        shippingInfoBody: "Options are calculated at checkout.",
        proceedToCheckout: "Proceed to checkout",
      },
      error: {
        title: "Something went wrong.",
      },
      sessionExpired: {
        title: "Session Expired",
        description: "Your session has expired. This cart was linked to your account.",
        youCan: "You can:",
        login: "Log in",
        loginHint: "to recover your cart",
        continueGuest: "Continue as guest",
        continueGuestHint: "with a new empty cart",
      },
    },

    auth: {
      common: {
        emailLabel: "Email address",
        passwordLabel: "Password",
        confirmPasswordLabel: "Confirm password",
        backToLogin: "Back to login",
        continueWith: "Or continue with",
        continueWithGoogle: "Continue with Google",
        showPassword: "Show password",
        hidePassword: "Hide password",
      },
      login: {
        title: "Welcome Back",
        subtitle: "Log in to your ElectroVar account",
        forgotPassword: "Forgot password?",
        signIn: "Sign In",
        signingIn: "Signing in...",
        noAccount: "Don't have an account?",
        createAccount: "Create account",
        errorTitle: "Something went wrong",
        defaultError: "Login failed",
      },
      register: {
        title: "Create account",
        subtitle: "Create your ElectroVar account",
        nameLabel: "Name (optional)",
        namePlaceholder: "Your name",
        signUp: "Create account",
        signingUp: "Creating...",
        haveAccount: "Already have an account?",
        goToLogin: "Go to login",
        errorTitle: "Something went wrong",
        defaultError: "Register failed",
        emailLabel: "Email address",
        emailPlaceholder: "name@company.com",
        passwordLabel: "Password",
        passwordPlaceholder: "••••••••",
        confirmPasswordLabel: "Confirm password",
        confirmPasswordPlaceholder: "••••••••",
        showPassword: "Show password",
        hidePassword: "Hide password",
        mismatch: "Passwords do not match.",
      },
      forgot: {
        title: "Forgot password",
        subtitle: "We’ll send you a code to reset your password.",
        sendCode: "Send code",
        sending: "Sending...",
        successTitle: "Check your email",
        successBody: "If the email exists, we sent a verification code.",
        iHaveCode: "I have a code",
        errorTitle: "Something went wrong",
        defaultError: "Failed to request reset",
      },
      reset: {
        title: "Reset password",
        subtitle: "Enter the code from your email and choose a new password.",
        codeLabel: "Code",
        codePlaceholder: "123456",
        newPasswordLabel: "New Password",
        confirmPasswordLabel: "Confirm Password",
        mismatch: "Passwords do not match.",
        resetPassword: "Reset password",
        resetBtn: "Reset password",
        resetting: "Resetting...",
        needCode: "Need a code?",
        errorTitle: "Something went wrong",
        defaultError: "Failed to reset password",
      },
      callback: {
        signingIn: "Signing you in...",
        failedTitle: "Authentication failed",
        defaultError: "Google login failed",
      },
    },

    productDetail: {
      breadcrumbs: { home: "Home", products: "Products" },
      stock: { available: "Available", out: "Out of stock" },
      actions: {
        addToCart: "Add to cart",
        adding: "Adding...",
        added: "Added ✓",
        buyNow: "Buy now",
      },
      perks: {
        shipping: "Shipping",
        returns: "30-day returns",
      },
      specs: {
        title: "Technical specifications",
        empty: "This product has no specs yet.",
        downloadPdf: "Download full PDF",
      },
      states: {
        loading: "Loading product...",
        errorTitle: "Something went wrong",
        backToCatalog: "Back to catalog",
      },
    },
  },
};