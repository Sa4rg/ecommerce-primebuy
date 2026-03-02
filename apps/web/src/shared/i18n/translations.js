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
      prefill: {
        title: "Usar tu última dirección",
        useButton: "Usar esta dirección",
      },
    },

    payment: {
      loading: "Cargando...",
      title: "Confirmación de Pago",
      subtitle: "Por favor, completa tu transferencia para finalizar el pedido.",
      breadcrumb: {
        cart: "Carrito",
        backToCheckout: "Volver al checkout",
        checkoutLocked: "Checkout bloqueado",
      },
      status: {
        orderId: "ID del Pedido",
        method: "Método Seleccionado",
        totalToPay: "Total a Pagar",
      },
      methods: {
        zelle: "Zelle",
        zinli: "Zinli",
        pago_movil: "Pago Móvil",
        bank_transfer: "Transferencia Bancaria",
      },
      instructions: {
        title: "Instrucciones de Pago",
        copy: "📋 Copiar",
        copied: "Copiado ✅",
        important: "Importante",
        zelle: {
          subtitle: "Realiza tu pago vía Zelle con los siguientes datos:",
          receiverLabel: "Correo del Receptor",
          receiverValue: "payments@tienda.com",
          note: "Incluye el ID del pedido en la nota de la transferencia.",
        },
        zinli: {
          subtitle: "Realiza tu pago vía Zinli con los siguientes datos:",
          receiverLabel: "Cuenta / Correo",
          receiverValue: "payments@tienda.com",
          note: "Incluye el ID del pedido en la nota.",
        },
        pago_movil: {
          subtitle: "Realiza tu Pago Móvil con los siguientes datos:",
          receiverLabel: "Datos",
          receiverValue: "Banco 0102, CI..., Tel...",
          note: "Incluye el ID del pedido en la referencia.",
        },
        bank_transfer: {
          subtitle: "Realiza tu transferencia con los siguientes datos:",
          receiverLabel: "Cuenta",
          receiverValue: "Cuenta: 0102-... Titular: ...",
          note: "Incluye el ID del pedido en la referencia.",
        },
      },
      proof: {
        title: "Enviar Comprobante",
        referenceLabel: "Número de Referencia",
        referencePlaceholder: "Ej: 123456789",
        fileLabel: "Comprobante de Pago",
        dropOrClick: "Arrastra tu captura de pantalla o haz clic para subir",
        fileHint: "PNG, JPG hasta 5MB",
        uploading: "Subiendo...",
        sending: "Enviando...",
        submitButton: "Enviar comprobante y finalizar compra",
        removeFile: "Eliminar archivo",
        bothRequired: "Debes ingresar la referencia y subir el comprobante",
        referenceRequired: "Debes ingresar el número de referencia",
        fileRequired: "Debes subir el comprobante de pago",
      },
      errors: {
        submitFailed: "Error al enviar el comprobante",
        invalidFileType: "Solo se permiten imágenes (PNG, JPG)",
        fileTooLarge: "El archivo es demasiado grande (máx 5MB)",
      },
      submitted: {
        message: "Comprobante enviado. Esperando confirmación del admin…",
      },
      confirmed: {
        message: "¡Pago confirmado!",
        viewOrder: "Ver tu orden",
      },
      rejected: {
        message: "Rechazado",
        noReason: "Sin razón especificada",
      },
      actions: {
        continueShopping: "Continuar comprando",
        backToCheckout: "Volver al checkout",
      },
      summary: {
        title: "Resumen del Pedido",
        loading: "Cargando resumen…",
        qty: "Cantidad",
        subtotal: "Subtotal",
        shipping: "Envío",
        free: "Gratis",
        total: "Total",
      },
      trust: "Pago 100% Seguro & Verificado",
    },

    adminPayments: {
      title: "Admin · Payments",
      subtitle: "Revisa y gestiona los pagos enviados por clientes.",
      actions: {
        exportCsv: "Exportar CSV",
        viewDetails: "Ver detalles",
        confirm: "Confirmar",
        confirming: "Confirmando...",
        reject: "Rechazar",
        rejecting: "Rechazando...",
        rejectPayment: "Rechazar pago",
        cancel: "Cancelar",
      },
      tabs: {
        all: "Todos",
        pendingReview: "Pendiente de revisión",
        confirmed: "Confirmados",
        rejected: "Rechazados",
      },
      search: {
        placeholder: "Buscar transacciones...",
      },
      pagination: {
        showing: "Mostrando {from}-{to} de {total} entradas",
        prev: "Anterior",
        next: "Siguiente",
        rowsPerPage: "Filas por página:",
      },
      table: {
        paymentId: "Payment ID",
        method: "Método",
        amount: "Monto",
        reference: "Referencia",
        status: "Estado",
        submittedAt: "Enviado",
        actions: "Acciones",
        viewProof: "Ver comprobante",
      },
      status: {
        pendingReview: "Pendiente de revisión",
        confirmed: "Confirmado",
        rejected: "Rechazado",
        pending: "Pendiente",
      },
      states: {
        loading: "Cargando...",
        empty: "No se encontraron pagos.",
      },
      confirm: {
        confirmPayment:
          "¿Seguro que deseas CONFIRMAR este pago?\nEsto creará la orden y disminuirá el stock.",
      },
      alerts: {
        paymentConfirmed: "¡Pago confirmado! Orden creada: {orderId}",
        error: "Error: {message}",
      },
      errors: {
        failedToLoad: "No se pudieron cargar los pagos",
        failedToConfirm: "No se pudo confirmar",
        failedToReject: "No se pudo rechazar",
      },
      reject: {
        title: "Rechazar pago",
        subtitle: "Por favor indica una razón para el rechazo:",
        placeholder: "Razón del rechazo...",
        reasonRequiredAlert: "Por favor indica una razón para el rechazo",
      },
      summary: {
        todaysRevenueUsd: "Ingresos de hoy (USD)",
        unverifiedPayments: "Pagos no verificados",
        highPriority: "Alta prioridad",
        systemHealth: "Salud del sistema",
        active: "Activo",
        stable: "Estable",
      },
    },

    adminPaymentsDetail: {
      breadcrumb: {
        payments: "Payments",
      },
      title: "Detalle de Pago -",
      states: {
        loading: "Cargando…",
        notFound: "Pago no encontrado",
      },
      errors: {
        loadFailed: "No se pudo cargar el detalle del pago",
        confirmFailed: "No se pudo confirmar el pago",
        rejectFailed: "No se pudo rechazar el pago",
        prepareFailed: "No se pudo iniciar la preparación",
        dispatchFailed: "No se pudo marcar como despachado",
        deliverFailed: "No se pudo marcar como entregado",
        trackingRequired: "Tracking number requerido para Envío Nacional.",
        rejectReasonRequired: "Debes colocar un motivo.",
      },
      confirm: {
        confirmPayment: "Confirmar este pago? Esto crea la orden y descuenta stock.",
        markDelivered: "Marcar como entregado? Esto completará la orden.",
      },
      actions: {
        back: "Volver",
        backToList: "Volver a la lista",
        cancel: "Cancelar",
        confirmPayment: "Confirmar pago",
        confirming: "Confirmando...",
        reject: "Rechazar",
        rejectPayment: "Rechazar pago",
        rejecting: "Rechazando...",
        startPreparation: "Iniciar preparación",
        starting: "Iniciando...",
        markDispatched: "Marcar despachado",
        dispatching: "Despachando...",
        markDelivered: "Marcar entregado",
        saving: "Guardando...",
      },
      workflow: {
        title: "Estado del flujo",
        currentState: "Estado actual:",
        steps: {
          PENDING: "PENDIENTE",
          CONFIRMED: "CONFIRMADO",
          PREPARING: "PREPARANDO",
          SHIPPED: "DESPACHADO",
          DELIVERED: "ENTREGADO",
        },
        states: {
          pending: "Esperando verificación",
          confirmed: "Pago confirmado",
          preparing: "Preparando pedido",
          shipped: "Despachado",
          delivered: "Entregado / Completado",
          rejected: "Rechazado",
        },
      },
      dispatch: {
        carrier: "Carrier",
        trackingNumber: "Tracking Number",
        trackingPlaceholder: "Ej: 123456789",
      },
      paymentSummary: {
        title: "Resumen del pago",
        paymentId: "ID del pago",
        amount: "Monto",
        date: "Fecha",
        reference: "Referencia",
      },
      orderItems: {
        title: "Productos de la orden",
        columns: {
          product: "Producto",
          qty: "Cant.",
          price: "Precio",
          total: "Total",
        },
        emptyWithOrder: "Sin items",
        emptyNoOrder: "Orden aún no creada (confirma el pago primero).",
        subtotal: "Subtotal:",
      },
      delivery: {
        badgeTitle: "Método de entrega",
        requiresDispatch: "Requiere despacho",
        noDispatchNeeded: "No requiere despacho",
      },
      customer: {
        title: "Datos del cliente",
        subtitle: "Snapshot del cliente",
        email: "Email",
        phone: "Teléfono",
      },
      shipping: {
        title: "Envío / Delivery",
        noOrder: "La orden aún no ha sido creada.",
        noAddress: "Sin dirección (Pickup).",
        recipient: "Destinatario:",
        phone: "Teléfono:",
        state: "Estado:",
        city: "Ciudad:",
        line1: "Dirección:",
        reference: "Ref:",
        tracking: "Tracking:",
      },
      rejectModal: {
        title: "Rechazar pago",
        reason: "Motivo:",
        placeholder: "Motivo del rechazo...",
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
        coverLabel: "Imagen principal (cover)",
        coverPlaceholder: "https://.../cover.jpg",
        coverHelp: "La imagen principal se mostrará en listados.",

        // upload states
        uploading: "Subiendo...",
        dropOrClick: "Arrastra una imagen aquí o haz clic para seleccionar",
        dropMultiple: "Arrastra archivos aquí para añadirlos a la galería",

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

    account: {
      breadcrumb: {
        home: "Inicio",
        account: "Mi Cuenta",
      },
      header: {
        greeting: "Hola {name}, esta es tu cuenta",
        title: "Mi Cuenta",
        subtitle: "Aquí puedes gestionar tus pedidos y pagos.",
      },
      actions: {
        backToCatalog: "Volver al catálogo",
        goToCart: "Ir al carrito",
        startNewCart: "Iniciar nuevo carrito",
        refresh: "Refresh",
      },
      tabs: {
        orders: "Mis Pedidos",
        payments: "Mis Pagos",
      },
      states: {
        loading: "Loading...",
      },
      errors: {
        loadFailed: "Failed to load account data",
      },
      badges: {
        pending: "PENDIENTE",
        confirmed: "CONFIRMADO",
        rejected: "RECHAZADO",
        paid: "PAGADO",
        processing: "PROCESANDO",
        completed: "COMPLETADO",
        cancelled: "CANCELADO",
      },
      orders: {
        empty: {
          title: "No tienes pedidos aún",
          body: "Cuando completes una compra, tus pedidos aparecerán aquí.",
        },
        card: {
          title: "Pedido",
          itemsLabel: "Items:",
          viewDetails: "Ver detalles",
        },
        info: {
          title: "Seguimiento y estados",
          body: "Dentro de cada pedido podrás ver el estado de envío y los detalles completos.",
        },
      },
      payments: {
        empty: {
          title: "No tienes pagos aún",
          body: "Cuando envíes un comprobante de pago, aparecerá aquí con su estatus.",
        },
        card: {
          id: "ID:",
          ref: "Ref:",
          viewStatus: "Ver estatus",
          viewOrder: "Ver pedido",
        },
        rejected: {
          title: "Pago Rechazado",
          reason: "Motivo:",
        },
      },
      help: {
        title: "¿Tienes dudas con un pago?",
        body: "Nuestro equipo de soporte está disponible para ayudarte con cualquier inconveniente con tus transacciones.",
        cta: "Contactar Soporte",
        ctaPlaceholder: "Soporte: próximamente (placeholder)",
        whatsappMessage: "Hola, necesito ayuda con un pago en ElectroVar.",
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
      prefill: {
        title: "Use your last address",
        useButton: "Use this address",
      },
    },

    payment: {
      loading: "Loading...",
      title: "Payment Confirmation",
      subtitle: "Please complete your transfer to finalize your order.",
      breadcrumb: {
        cart: "Cart",
        backToCheckout: "Back to checkout",
        checkoutLocked: "Checkout locked",
      },
      status: {
        orderId: "Order ID",
        method: "Selected Method",
        totalToPay: "Total to Pay",
      },
      methods: {
        zelle: "Zelle",
        zinli: "Zinli",
        pago_movil: "Pago Móvil",
        bank_transfer: "Bank Transfer",
      },
      instructions: {
        title: "Payment Instructions",
        copy: "📋 Copy",
        copied: "Copied ✅",
        important: "Important",
        zelle: {
          subtitle: "Make your Zelle payment using the following details:",
          receiverLabel: "Receiver Email",
          receiverValue: "payments@tienda.com",
          note: "Include the order ID in the transfer note.",
        },
        zinli: {
          subtitle: "Make your Zinli payment using the following details:",
          receiverLabel: "Account / Email",
          receiverValue: "payments@tienda.com",
          note: "Include the order ID in the note.",
        },
        pago_movil: {
          subtitle: "Make your Pago Móvil payment using the following details:",
          receiverLabel: "Details",
          receiverValue: "Bank 0102, ID..., Phone...",
          note: "Include the order ID in the reference.",
        },
        bank_transfer: {
          subtitle: "Make your bank transfer using the following details:",
          receiverLabel: "Account",
          receiverValue: "Account: 0102-... Holder: ...",
          note: "Include the order ID in the reference.",
        },
      },
      proof: {
        title: "Submit Proof",
        referenceLabel: "Reference Number",
        referencePlaceholder: "E.g.: 123456789",
        fileLabel: "Payment Proof",
        dropOrClick: "Drag your screenshot here or click to upload",
        fileHint: "PNG, JPG up to 5MB",
        uploading: "Uploading...",
        sending: "Sending...",
        submitButton: "Submit proof and complete purchase",
        removeFile: "Remove file",
        bothRequired: "You must enter the reference and upload the proof",
        referenceRequired: "You must enter the reference number",
        fileRequired: "You must upload the payment proof",
      },
      errors: {
        submitFailed: "Failed to submit proof",
        invalidFileType: "Only images allowed (PNG, JPG)",
        fileTooLarge: "File is too large (max 5MB)",
      },
      submitted: {
        message: "Proof submitted. Waiting for admin confirmation…",
      },
      confirmed: {
        message: "Payment confirmed!",
        viewOrder: "View your order",
      },
      rejected: {
        message: "Rejected",
        noReason: "No reason specified",
      },
      actions: {
        continueShopping: "Continue shopping",
        backToCheckout: "Back to checkout",
      },
      summary: {
        title: "Order Summary",
        loading: "Loading summary…",
        qty: "Qty",
        subtotal: "Subtotal",
        shipping: "Shipping",
        free: "Free",
        total: "Total",
      },
      trust: "100% Secure & Verified Payment",
    },

    adminPayments: {
      title: "Admin · Payments",
      subtitle: "Review and manage customer payment submissions.",
      actions: {
        exportCsv: "Export CSV",
        viewDetails: "View Details",
        confirm: "Confirm",
        confirming: "Confirming...",
        reject: "Reject",
        rejecting: "Rejecting...",
        rejectPayment: "Reject Payment",
        cancel: "Cancel",
      },
      tabs: {
        all: "All",
        pendingReview: "Pending Review",
        confirmed: "Confirmed",
        rejected: "Rejected",
      },
      search: {
        placeholder: "Search transactions...",
      },
      pagination: {
        showing: "Showing {from}-{to} of {total} entries",
        prev: "Prev",
        next: "Next",
        rowsPerPage: "Rows per page:",
      },
      table: {
        paymentId: "Payment ID",
        method: "Method",
        amount: "Amount",
        reference: "Reference",
        status: "Status",
        submittedAt: "Submitted At",
        actions: "Actions",
        viewProof: "View proof",
      },
      status: {
        pendingReview: "Pending Review",
        confirmed: "Confirmed",
        rejected: "Rejected",
        pending: "Pending",
      },
      states: {
        loading: "Loading...",
        empty: "No payments found.",
      },
      confirm: {
        confirmPayment:
          "Are you sure you want to CONFIRM this payment?\nThis will create the order and decrement stock.",
      },
      alerts: {
        paymentConfirmed: "Payment confirmed! Order created: {orderId}",
        error: "Error: {message}",
      },
      errors: {
        failedToLoad: "Failed to load payments",
        failedToConfirm: "Failed to confirm",
        failedToReject: "Failed to reject",
      },
      reject: {
        title: "Reject Payment",
        subtitle: "Please provide a reason for rejection:",
        placeholder: "Reason for rejection...",
        reasonRequiredAlert: "Please provide a reason for rejection",
      },
      summary: {
        todaysRevenueUsd: "Today's Revenue (USD)",
        unverifiedPayments: "Unverified Payments",
        highPriority: "High Priority",
        systemHealth: "System Health",
        active: "Active",
        stable: "Stable",
      },
    },

    adminPaymentsDetail: {
      breadcrumb: {
        payments: "Payments",
      },
      title: "Payment Detail -",
      states: {
        loading: "Loading…",
        notFound: "Payment not found",
      },
      errors: {
        loadFailed: "Failed to load payment detail",
        confirmFailed: "Failed to confirm payment",
        rejectFailed: "Failed to reject payment",
        prepareFailed: "Failed to start preparation",
        dispatchFailed: "Failed to dispatch",
        deliverFailed: "Failed to mark delivered",
        trackingRequired: "Tracking number is required for National Shipping.",
        rejectReasonRequired: "Please provide a rejection reason.",
      },
      confirm: {
        confirmPayment: "Confirm this payment? This creates the order and decrements stock.",
        markDelivered: "Mark as delivered? This will complete the order.",
      },
      actions: {
        back: "Back",
        backToList: "Back to list",
        cancel: "Cancel",
        confirmPayment: "Confirm payment",
        confirming: "Confirming...",
        reject: "Reject",
        rejectPayment: "Reject payment",
        rejecting: "Rejecting...",
        startPreparation: "Start preparation",
        starting: "Starting...",
        markDispatched: "Mark dispatched",
        dispatching: "Dispatching...",
        markDelivered: "Mark delivered",
        saving: "Saving...",
      },
      workflow: {
        title: "Workflow status",
        currentState: "Current state:",
        steps: {
          PENDING: "PENDING",
          CONFIRMED: "CONFIRMED",
          PREPARING: "PREPARING",
          SHIPPED: "SHIPPED",
          DELIVERED: "DELIVERED",
        },
        states: {
          pending: "Waiting for verification",
          confirmed: "Payment confirmed",
          preparing: "Preparing order",
          shipped: "Dispatched",
          delivered: "Delivered / Completed",
          rejected: "Rejected",
        },
      },
      dispatch: {
        carrier: "Carrier",
        trackingNumber: "Tracking Number",
        trackingPlaceholder: "e.g. 123456789",
      },
      paymentSummary: {
        title: "Payment summary",
        paymentId: "Payment ID",
        amount: "Amount",
        date: "Date",
        reference: "Reference",
      },
      orderItems: {
        title: "Order items",
        columns: {
          product: "Product",
          qty: "Qty",
          price: "Price",
          total: "Total",
        },
        emptyWithOrder: "No items",
        emptyNoOrder: "Order not created yet (confirm payment first).",
        subtotal: "Subtotal:",
      },
      delivery: {
        badgeTitle: "Delivery method",
        requiresDispatch: "Requires dispatch",
        noDispatchNeeded: "No dispatch needed",
      },
      customer: {
        title: "Customer details",
        subtitle: "Customer snapshot",
        email: "Email",
        phone: "Phone",
      },
      shipping: {
        title: "Shipping / delivery",
        noOrder: "Order not created yet.",
        noAddress: "No address (Pickup).",
        recipient: "Recipient:",
        phone: "Phone:",
        state: "State:",
        city: "City:",
        line1: "Address:",
        reference: "Ref:",
        tracking: "Tracking:",
      },
      rejectModal: {
        title: "Reject payment",
        reason: "Reason:",
        placeholder: "Reason for rejection...",
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

        coverLabel: "Cover image",
        coverPlaceholder: "https://.../cover.jpg",
        coverHelp: "The main image will be displayed in listings.",

        // upload states
        uploading: "Uploading...",
        dropOrClick: "Drag an image here or click to select",
        dropMultiple: "Drag files here to add them to the gallery",

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

    account: {
      breadcrumb: {
        home: "Home",
        account: "My Account",
      },
      header: {
        greeting: "Hi {name}, this is your account",
        title: "My Account",
        subtitle: "Here you can manage your orders and payments.",
      },
      actions: {
        backToCatalog: "Back to catalog",
        goToCart: "Go to cart",
        startNewCart: "Start a new cart",
        refresh: "Refresh",
      },
      tabs: {
        orders: "My Orders",
        payments: "My Payments",
      },
      states: {
        loading: "Loading...",
      },
      errors: {
        loadFailed: "Failed to load account data",
      },
      badges: {
        pending: "PENDING",
        confirmed: "CONFIRMED",
        rejected: "REJECTED",
        paid: "PAID",
        processing: "PROCESSING",
        completed: "COMPLETED",
        cancelled: "CANCELLED",
      },
      orders: {
        empty: {
          title: "You have no orders yet",
          body: "Once you complete a purchase, your orders will appear here.",
        },
        card: {
          title: "Order",
          itemsLabel: "Items:",
          viewDetails: "View details",
        },
        info: {
          title: "Tracking and statuses",
          body: "Inside each order you can view shipping status and full details.",
        },
      },
      payments: {
        empty: {
          title: "You have no payments yet",
          body: "Once you submit a payment proof, it will appear here with its status.",
        },
        card: {
          id: "ID:",
          ref: "Ref:",
          viewStatus: "View status",
          viewOrder: "View order",
        },
        rejected: {
          title: "Payment Rejected",
          reason: "Reason:",
        },
      },
      help: {
        title: "Need help with a payment?",
        body: "Our support team is available to help you with any issues regarding your transactions.",
        cta: "Contact support",
        ctaPlaceholder: "Support: coming soon (placeholder)",
        whatsappMessage: "Hi, I need help with a payment on ElectroVar.",
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