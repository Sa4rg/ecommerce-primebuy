// web/src/shared/i18n/translations.js

export const translations = {
  es: {
    navbar: {
      searchPlaceholder: "Buscar productos...",
      cart: "Carrito",
      account: "Cuenta",
      admin: "Admin",
      contact: "Contáctanos",
      products: "Productos",
      login: "Ingresar",
      register: "Registrarse",
      logout: "Salir",
      startShopping: "Comenzar a Comprar",
      catalog: "Catálogo",
    },

    footer: {
      brandDescription:
        "Tu tienda de confianza para repuestos eléctricos y soluciones industriales de alta calidad.",
      navigation: {
        title: "Navegación",
        store: "Tienda Online",
        services: "Servicios Técnicos",
        brands: "Nuestras Marcas",
        locations: "Ubicaciones",
      },
      support: {
        title: "Soporte",
        faq: "Preguntas Frecuentes",
        shipping: "Métodos de Envío",
        returns: "Políticas de Devolución",
        warranty: "Garantías",
      },
      contact: {
        title: "Contacto",
        emailValue: "info@primebuy.com",
        phoneValue: "+58 (212) 555-0123",
        phoneHref: "+582125550123",
        locationValue: "Caracas, Venezuela",
      },
      rights: "Todos los derechos reservados.",
      legal: {
        terms: "Términos y Condiciones",
        privacy: "Privacidad",
      },
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
        equivalentVES: "Equivalente en Bs.",
        rateInfo: "Tasa: 1 USD = {rate} VES",
      },
      actions: {
        processing: "Procesando...",
        continueToPayment: "Continuar con el pago",
        completeAddressHint: "Completa toda la información de envío para habilitar el pago.",
      },
      delivery: {
        whatsappNotice: "El precio de envío para delivery local se coordina por WhatsApp antes del pago.",
        whatsappMessage: "Hola! Quiero coordinar un delivery para mi pedido de {total} ({items} productos).",
        contactWhatsApp: "Coordinar por WhatsApp",
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
        account: "Mi Cuenta",
        backToPayments: "Volver a mis pagos",
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

    adminFx: {
      title: "Tasa de Cambio",
      subtitle: "Establecer la tasa USD → VES del día para pagos en bolívares",
      currentRate: "Tasa actual",
      noRateSet: "Sin tasa establecida",
      lastUpdated: "Última actualización",
      updateRate: "Actualizar tasa",
      newRateLabel: "Nueva tasa (VES por 1 USD)",
      saveButton: "Guardar tasa",
      saving: "Guardando...",
      success: "¡Tasa actualizada correctamente!",
      errorLoading: "Error al cargar la tasa actual",
      errorSaving: "Error al guardar la tasa",
      invalidRate: "Ingresa una tasa válida mayor a 0",
      info: "Esta tasa se usa para calcular el monto en bolívares cuando un cliente selecciona Pago Móvil o Transferencia Bancaria.",
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
          categorySelect: "Selecciona una categoría...",
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
        added: "Agregado",
      },
      category: {
        general: "General",
      },
      errors: {
        notEnoughStockToAdd: "No hay suficiente stock para agregar otra unidad.",
        unknown: "No se pudo agregar el producto al carrito.",
      },
    },

    productCatalog: {
      breadcrumbs: {
        home: "Home",
        catalog: "Catálogo",
      },
      sidebar: {
        categories: "Categorías",
        all: "Todos",
        cameras: "Cámaras",
        watches: "Relojes",
        toysGames: "Juguetes y juegos",
        home: "Hogar",
        adultToys: "Juguetes para Adultos",
        ledAccessories: "Accesorios LED",
        vehicleAccessories: "Accesorios de Vehículos",
        priceRange: "Rango de precios",
        minPrice: "Precio mín.",
        maxPrice: "Precio máx.",
        resetPrice: "Resetear precio",
      },
      header: {
        titleCatalog: "Catálogo",
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
        catalog: "Catálogo",
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
        errors: {
          insufficientStock: "No puedes agregar más unidades de este producto.",
          generic: "No fue posible actualizar la cantidad.",
        },
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
        equivalentVES: "Equivalente en Bs.",
        rateInfo: "Tasa: 1 USD = {rate} VES",
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
        refresh: "Actualizar",
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
        whatsappMessage: "Hola, necesito ayuda con un pago en Prime Buy.",
      },
    },

    orderDetail: {
      loading: "Cargando pedido…",
      errors: {
        loadFailed: "No se pudo cargar el pedido.",
      },

      breadcrumb: {
        account: "Mi Cuenta",
        order: "Pedido #{id}",
      },

      backToAccount: "Volver a Mi Cuenta",
      backToOrders: "Volver a mis pedidos",

      title: "Detalle del Pedido #{id}",
      placedOn: "Realizado el {date}",

      invoiceBtn: "Factura PDF",
      invoiceTitle: "Factura · Pedido #{id}",
      invoiceDate: "Fecha",
      orderIdLabel: "Order ID",
      printOrSavePdf: "Imprimir / Guardar como PDF",
      close: "Cerrar",

      status: {
        paid: "Pagado",
        processing: "En preparación",
        completed: "Completado",
        cancelled: "Cancelado",
        created: "Creado",
      },

      customerTitle: "Datos del Cliente",
      customerName: "Nombre",
      customerEmail: "Email",
      customerPhone: "Teléfono",

      shippingTitle: "Envío / Entrega",
      shippingMethod: "Método",
      shippingAddress: "Dirección",
      shippingCompany: "Empresa",
      shippingTracking: "Tracking",
      shipping: {
        pickup: "Retiro en tienda",
      },

      currentStatusTitle: "Estado Actual",
      timeline: {
        created: "Pedido creado",
        current: "Estado: {status}",
        currentLabel: "Actual",
        dispatched: "Despachado",
        delivered: "Entregado",
        pickupReady: "Listo para retiro",
        pickupDone: "Retirado en tienda",
        pending: "Pendiente",
        completed: "Completado",
        ready: "Listo",
      },

      itemsTitle: "Productos en este pedido",
      itemsCount: "{count} ítems",
      table: {
        product: "Producto",
        productId: "ID",
        qty: "Cantidad",
        unitPrice: "Precio Unit.",
        subtotal: "Subtotal",
      },

      total: "Total",
      totalOrder: "Total del Pedido",
      pricesIn: "Precios expresados en {currency}",

      needHelp: "¿Necesitas ayuda con este pedido?",
      contactSupport: "Contactar Soporte",
      reportProblem: "reportar un problema",
      or: "o",

      trackShipment: "Seguir mi envío",
    },
    support: {
      whatsappMessageOrder: "Hola, necesito ayuda con mi pedido #{orderId} en Prime Buy.",
      whatsappMessageProblemOrder: "Hola, quiero reportar un problema con mi pedido #{orderId} en Prime Buy.",
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
        subtitle: "Inicia sesión en tu cuenta de Prime Buy",
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
        subtitle: "Crea tu cuenta de Prime Buy",
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
      password: {
        policyHeader: "Tu contraseña debe tener:",
        minLength: "Mínimo 8 caracteres",
        requiresUppercase: "Al menos una mayúscula",
        requiresSpecial: "Al menos un carácter especial (!@#$...)",
        required: "La contraseña es obligatoria",
      },
      verify: {
        title: "Verifica tu email",
        subtitle: "Enviamos un código de 6 dígitos a",
        codeLabel: "Código de verificación",
        submit: "Verificar",
        submitting: "Verificando...",
        resendPrompt: "¿No recibiste el código?",
        resendLink: "Reenviar código",
        resendSuccess: "Código reenviado",
        resending: "Reenviando...",
        invalidCode: "Código inválido o expirado",
        expired: "El código ha expirado. Solicita uno nuevo.",
        tooManyAttempts: "Demasiados intentos. Solicita un código nuevo.",
        alreadyVerified: "Este email ya está verificado.",
        notVerified: "Por favor verifica tu email antes de iniciar sesión.",
      },
    },

    productDetail: {
      breadcrumbs: { home: "Home", products: "Catálogo" },
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

    legal: {
      common: {
        updatedAt: "Última actualización: {date}",
        contactTitle: "Contacto",
        contactEmail: "Email: {email}",
        location: "Ubicación: {location}",
        scope: "Operamos y vendemos únicamente dentro de Venezuela.",
        disclaimer:
          "Este documento es un texto informativo para el funcionamiento del sitio. Para asesoría legal, consulta con un profesional.",
      },
      terms: {
        title: "Términos y Condiciones",
        intro:
          "Al acceder y utilizar Prime Buy, aceptas estos términos. Si no estás de acuerdo, por favor no uses el sitio.",
        sections: {
          serviceTitle: "1. Servicio",
          serviceText:
            "Prime Buy ofrece un catálogo de productos y permite realizar pedidos y pagos a través de la plataforma.",
          accountsTitle: "2. Cuentas y acceso",
          accountsText:
            "Eres responsable de mantener la confidencialidad de tu cuenta y de la veracidad de los datos suministrados.",
          pricesTitle: "3. Precios y disponibilidad",
          pricesText:
            "Los precios y disponibilidad pueden cambiar sin previo aviso. Los montos pueden mostrarse en USD y/o VES según la tasa configurada. El monto final se confirma durante el checkout.",
          paymentsTitle: "4. Pagos y verificación",
          paymentsText:
            "Algunos pagos pueden requerir comprobante y verificación manual. Prime Buy puede rechazar pagos inconsistentes o incompletos.",
          shippingTitle: "5. Envíos y entregas",
          shippingText:
            "Los tiempos de entrega son estimados. El seguimiento depende del proveedor logístico (por ejemplo, MRW, ZOOM) cuando aplique.",
          returnsTitle: "6. Devoluciones y garantías",
          returnsText:
            "Las devoluciones y garantías aplican según el tipo de producto y condiciones informadas por soporte. Algunos productos pueden no ser elegibles.",
          responsibilityTitle: "7. Limitación de responsabilidad",
          responsibilityText:
            "Prime Buy no será responsable por daños indirectos, pérdida de datos o interrupciones del servicio fuera de nuestro control.",
          changesTitle: "8. Cambios",
          changesText:
            "Podemos actualizar estos términos. La fecha de actualización se mostrará al inicio del documento.",
        },
      },
      privacy: {
        title: "Política de Privacidad",
        intro:
          "Esta política describe cómo recopilamos, usamos y protegemos tu información al usar Prime Buy.",
        sections: {
          dataTitle: "1. Datos que recopilamos",
          dataText:
            "Podemos recopilar datos como nombre, email, teléfono, dirección de envío, historial de pedidos y datos de pago (por ejemplo, referencia de comprobante).",
          useTitle: "2. Uso de la información",
          useText:
            "Usamos tus datos para procesar pedidos, confirmar pagos, brindar soporte, enviar notificaciones del estado del pedido y mejorar la experiencia del sitio.",
          sharingTitle: "3. Compartir información",
          sharingText:
            "Compartimos información únicamente cuando es necesario para completar el servicio (por ejemplo, proveedores de envío) o por requerimientos legales.",
          securityTitle: "4. Seguridad",
          securityText:
            "Aplicamos medidas razonables para proteger tus datos. Ningún sistema es 100% seguro, pero trabajamos para minimizar riesgos.",
          cookiesTitle: "5. Cookies y almacenamiento local",
          cookiesText:
            "Podemos usar cookies y/o localStorage para mantener sesión, preferencias (como idioma) y mejorar la navegación.",
          rightsTitle: "6. Tus derechos",
          rightsText:
            "Puedes solicitar actualización o eliminación de tus datos escribiendo al email de contacto, sujeto a obligaciones legales y operativas.",
          changesTitle: "7. Cambios a esta política",
          changesText:
            "Podemos actualizar esta política. La fecha de actualización se mostrará al inicio del documento.",
        },
      },
    },

    support: {
      common: {
        updatedAt: "Última actualización: {{date}}",
        contactTitle: "Contacto",
        contactEmail: "Email: {{email}}",
        location: "Ubicación: {{location}}",
        disclaimer: "Este documento es informativo. Para asesoría legal, consulta con un profesional.",
        contactWhatsapp: "Contactar soporte por WhatsApp",
        whatsappMessage: "Hola, necesito ayuda con Prime Buy.",
        whatsappMessageShipping: "Hola, necesito ayuda con métodos de envío en Prime Buy.",
        whatsappMessageReturns: "Hola, necesito ayuda con devoluciones en Prime Buy.",
        whatsappMessageWarranty: "Hola, necesito ayuda con garantías en Prime Buy.",
      },

      faq: {
        title: "Preguntas Frecuentes",
        intro: "Aquí respondemos dudas comunes sobre compras, pagos, comprobantes y envíos.",
        sections: {
          paymentsTitle: "1. Pagos disponibles",
          paymentsText:
            "Ofrecemos métodos de pago en USD y VES según disponibilidad. Algunos métodos pueden requerir comprobante para verificación.",
          proofTitle: "2. Comprobantes y verificación",
          proofText:
            "Ciertos pagos requieren comprobante y revisión manual. Te notificaremos si necesitamos información adicional.",
          shippingTitle: "3. Envíos y entregas",
          shippingText:
            "Operamos únicamente dentro de Venezuela. Los tiempos de entrega son estimados y dependen del método de envío.",
          stockTitle: "4. Disponibilidad y stock",
          stockText:
            "La disponibilidad puede variar. Si un producto se agota, te contactaremos para ofrecer alternativas o reembolso según aplique.",
          supportTitle: "5. Soporte",
          supportText:
            "Puedes contactarnos por WhatsApp o correo para asistencia con pedidos, pagos o envíos.",
        },
      },

      shipping: {
        title: "Métodos de Envío",
        intro: "Información sobre nuestras opciones de envío y entregas dentro de Venezuela.",
        scope: "El seguimiento depende del proveedor logístico (por ejemplo, MRW, ZOOM) cuando aplique.",
        sections: {
          methodsTitle: "1. Opciones de envío",
          methodsText:
            "Podemos ofrecer entrega local (delivery) o envío nacional mediante agencias de encomiendas, según la zona.",
          timesTitle: "2. Tiempos estimados",
          timesText:
            "Los tiempos son estimados y pueden variar por disponibilidad, ubicación y logística del carrier.",
          trackingTitle: "3. Tracking / seguimiento",
          trackingText:
            "Si el envío cuenta con número de guía, lo compartiremos y podrás rastrearlo en el proveedor correspondiente.",
          addressTitle: "4. Dirección y datos del destinatario",
          addressText:
            "Asegúrate de colocar dirección completa, referencia y teléfono. Datos incompletos pueden retrasar la entrega.",
        },
      },

      returns: {
        title: "Políticas de Devolución",
        intro: "Condiciones generales para solicitudes de devolución o cambios.",
        scope: "Las devoluciones se evalúan caso por caso según el producto y el estado en que se encuentre.",
        sections: {
          eligibilityTitle: "1. Elegibilidad",
          eligibilityText:
            "Para solicitar devolución, el producto debe estar sin uso, con su empaque y accesorios, y dentro del período indicado por soporte.",
          exclusionsTitle: "2. Exclusiones",
          exclusionsText:
            "Algunos productos pueden no ser elegibles (por ejemplo: consumibles, productos instalados o con señales de uso).",
          processTitle: "3. Proceso",
          processText:
            "Contáctanos por WhatsApp indicando tu número de pedido, motivo y evidencia (si aplica). Te guiaremos con los próximos pasos.",
        },
      },

      warranty: {
        title: "Garantías",
        intro: "Información general sobre garantías y soporte postventa.",
        scope: "La garantía puede variar según el producto y/o fabricante. Validación sujeta a revisión.",
        sections: {
          coverageTitle: "1. Cobertura",
          coverageText:
            "La garantía cubre fallas de fabricación dentro del período aplicable. Se requiere evidencia y evaluación.",
          exclusionsTitle: "2. No cubre",
          exclusionsText:
            "No cubre daños por mal uso, golpes, humedad, instalación incorrecta, manipulación o desgaste normal.",
          processTitle: "3. Cómo solicitar",
          processText:
            "Escríbenos por WhatsApp con tu número de pedido, descripción del problema y fotos o video. Te indicaremos el procedimiento.",
        },
      },
    }
  },

  en: {
    navbar: {
      searchPlaceholder: "Search products...",
      cart: "Cart",
      account: "Account",
      admin: "Admin",
      products: "Products",
      contact: "Contact us",
      login: "Login",
      register: "Register",
      logout: "Logout",
      startShopping: "Start Shopping",
      catalog: "Catalog",
    },

    footer: {
      brandDescription:
        "Your trusted store for electrical parts and high-quality industrial solutions.",
      navigation: {
        title: "Navigation",
        store: "Online Store",
        services: "Technical Services",
        brands: "Our Brands",
        locations: "Locations",
      },
      support: {
        title: "Support",
        faq: "Frequently Asked Questions",
        shipping: "Shipping Methods",
        returns: "Return Policy",
        warranty: "Warranty",
      },
      contact: {
        title: "Contact",
        emailValue: "info@primebuy.com",
        phoneValue: "+58 (212) 555-0123",
        phoneHref: "+582125550123",
        locationValue: "Caracas, Venezuela",
      },
      rights: "All rights reserved.",
      legal: {
        terms: "Terms & Conditions",
        privacy: "Privacy",
      },
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
        equivalentVES: "Equivalent in Bs.",
        rateInfo: "Rate: 1 USD = {rate} VES",
      },
      actions: {
        processing: "Processing...",
        continueToPayment: "Continue to payment",
        completeAddressHint: "Complete all shipping information to enable payment.",
      },
      delivery: {
        whatsappNotice: "Local delivery price is coordinated via WhatsApp before payment.",
        whatsappMessage: "Hi! I want to coordinate a delivery for my order of {total} ({items} products).",
        contactWhatsApp: "Coordinate via WhatsApp",
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
        account: "My Account",
        backToPayments: "Back to my payments",
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

    adminFx: {
      title: "Exchange Rate",
      subtitle: "Set today's USD → VES rate for payments in bolivars",
      currentRate: "Current rate",
      noRateSet: "No rate set",
      lastUpdated: "Last updated",
      updateRate: "Update rate",
      newRateLabel: "New rate (VES per 1 USD)",
      saveButton: "Save rate",
      saving: "Saving...",
      success: "Rate updated successfully!",
      errorLoading: "Error loading current rate",
      errorSaving: "Error saving rate",
      invalidRate: "Enter a valid rate greater than 0",
      info: "This rate is used to calculate the amount in bolivars when a customer selects Pago Móvil or Bank Transfer.",
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
          categorySelect: "Select a category...",
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
        added: "Added ✓",
      },
      category: {
        general: "General",
      },
      errors: {
        notEnoughStockToAdd: "There is not enough stock to add another unit.",
        unknown: "Could not add the product to the cart.",
      },
    },

    productCatalog: {
      breadcrumbs: {
        home: "Home",
        catalog: "Catalog",
      },
      sidebar: {
        categories: "Categories",
        all: "All",
        cameras: "Cameras",
        watches: "Watches",
        toysGames: "Toys and Games",
        home: "Home",
        adultToys: "Adult Toys",
        ledAccessories: "LED Accessories",
        vehicleAccessories: "Vehicle Accessories",
        priceRange: "Price Range",
        minPrice: "Min price",
        maxPrice: "Max price",
        resetPrice: "Reset price",
      },
      header: {
        titleCatalog: "Catalog",
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
        catalog: "Catalog",
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
        errors: {
          insufficientStock: "You cannot add more units of this product.",
          generic: "Could not update the quantity.",
        },
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
        equivalentVES: "Equivalent in Bs.",
        rateInfo: "Rate: 1 USD = {rate} VES",
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
        whatsappMessage: "Hi, I need help with a payment on Prime Buy.",
      },
    },

    orderDetail: {
      loading: "Loading order…",
      errors: {
        loadFailed: "Failed to load order.",
      },

      breadcrumb: {
        account: "My Account",
        order: "Order #{id}",
      },

      backToAccount: "Back to My Account",
      backToOrders: "Back to my orders",

      title: "Order Detail #{id}",
      placedOn: "Placed on {date}",

      invoiceBtn: "Invoice PDF",
      invoiceTitle: "Invoice · Order #{id}",
      invoiceDate: "Date",
      orderIdLabel: "Order ID",
      printOrSavePdf: "Print / Save as PDF",
      close: "Close",

      status: {
        paid: "Paid",
        processing: "Preparing",
        completed: "Completed",
        cancelled: "Cancelled",
        created: "Created",
      },

      customerTitle: "Customer Details",
      customerName: "Name",
      customerEmail: "Email",
      customerPhone: "Phone",

      shippingTitle: "Shipping / Delivery",
      shippingMethod: "Method",
      shippingAddress: "Address",
      shippingCompany: "Carrier",
      shippingTracking: "Tracking",
      shipping: {
        pickup: "Store pickup",
      },

      currentStatusTitle: "Current Status",
      timeline: {
        created: "Order created",
        current: "Status: {status}",
        currentLabel: "Current",
        dispatched: "Dispatched",
        delivered: "Delivered",
        pickupReady: "Ready for pickup",
        pickupDone: "Picked up in store",
        pending: "Pending",
        completed: "Completed",
        ready: "Ready",
      },

      itemsTitle: "Items in this order",
      itemsCount: "{count} items",
      table: {
        product: "Product",
        productId: "ID",
        qty: "Qty",
        unitPrice: "Unit price",
        subtotal: "Subtotal",
      },

      total: "Total",
      totalOrder: "Order total",
      pricesIn: "Prices shown in {currency}",

      needHelp: "Need help with this order?",
      contactSupport: "Contact Support",
      reportProblem: "report a problem",
      or: "or",

      trackShipment: "Track shipment",
    },
    support: {
      whatsappMessageOrder: "Hi, I need help with my order #{orderId} at Prime Buy.",
      whatsappMessageProblemOrder: "Hi, I want to report a problem with my order #{orderId} at Prime Buy.",
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
        subtitle: "Log in to your Prime Buy account",
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
        subtitle: "Create your Prime Buy account",
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
      password: {
        policyHeader: "Your password must have:",
        minLength: "At least 8 characters",
        requiresUppercase: "At least one uppercase letter",
        requiresSpecial: "At least one special character (!@#$...)",
        required: "Password is required",
      },
      verify: {
        title: "Verify your email",
        subtitle: "We sent a 6-digit code to",
        codeLabel: "Verification code",
        submit: "Verify",
        submitting: "Verifying...",
        resendPrompt: "Didn't receive the code?",
        resendLink: "Resend code",
        resendSuccess: "Code resent",
        resending: "Resending...",
        invalidCode: "Invalid or expired code",
        expired: "Code expired. Request a new one.",
        tooManyAttempts: "Too many attempts. Request a new code.",
        alreadyVerified: "This email is already verified.",
        notVerified: "Please verify your email before logging in.",
      },
    },

    productDetail: {
      breadcrumbs: { home: "Home", products: "Catalog" },
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

    legal: {
      common: {
        updatedAt: "Last updated: {date}",
        contactTitle: "Contact",
        contactEmail: "Email: {email}",
        location: "Location: {location}",
        scope: "We operate and sell only within Venezuela.",
        disclaimer:
          "This document is informational for site operation. For legal advice, consult a professional.",
      },
      terms: {
        title: "Terms & Conditions",
        intro:
          "By accessing and using Prime Buy, you agree to these terms. If you do not agree, please do not use the site.",
        sections: {
          serviceTitle: "1. Service",
          serviceText:
            "Prime Buy provides a product catalog and allows placing orders and submitting payments through the platform.",
          accountsTitle: "2. Accounts and access",
          accountsText:
            "You are responsible for keeping your account confidential and for providing accurate information.",
          pricesTitle: "3. Prices and availability",
          pricesText:
            "Prices and availability may change without notice. Amounts may be shown in USD and/or VES based on the configured rate. Final amount is confirmed during checkout.",
          paymentsTitle: "4. Payments and verification",
          paymentsText:
            "Some payments may require proof and manual verification. Prime Buy may reject inconsistent or incomplete payments.",
          shippingTitle: "5. Shipping and delivery",
          shippingText:
            "Delivery times are estimates. Tracking depends on the shipping provider (e.g., MRW, ZOOM) when applicable.",
          returnsTitle: "6. Returns and warranties",
          returnsText:
            "Returns and warranties depend on product type and conditions provided by support. Some products may not be eligible.",
          responsibilityTitle: "7. Limitation of liability",
          responsibilityText:
            "Prime Buy is not liable for indirect damages, data loss, or service interruptions beyond our control.",
          changesTitle: "8. Changes",
          changesText:
            "We may update these terms. The updated date will be shown at the top of the document.",
        },
      },
      privacy: {
        title: "Privacy Policy",
        intro:
          "This policy explains how we collect, use, and protect your information when using Prime Buy.",
        sections: {
          dataTitle: "1. Data we collect",
          dataText:
            "We may collect data such as name, email, phone, shipping address, order history, and payment data (e.g., proof reference).",
          useTitle: "2. How we use your information",
          useText:
            "We use your data to process orders, confirm payments, provide support, send order status updates, and improve the site experience.",
          sharingTitle: "3. Sharing information",
          sharingText:
            "We share information only when necessary to provide the service (e.g., shipping providers) or when legally required.",
          securityTitle: "4. Security",
          securityText:
            "We apply reasonable measures to protect your data. No system is 100% secure, but we work to minimize risks.",
          cookiesTitle: "5. Cookies and local storage",
          cookiesText:
            "We may use cookies and/or localStorage to keep sessions, preferences (such as language), and improve navigation.",
          rightsTitle: "6. Your rights",
          rightsText:
            "You may request updates or deletion of your data by contacting the email below, subject to legal and operational obligations.",
          changesTitle: "7. Changes to this policy",
          changesText:
            "We may update this policy. The updated date will be shown at the top of the document.",
        },
      },
    },

    support: {
      common: {
        updatedAt: "Last updated: {{date}}",
        contactTitle: "Contact",
        contactEmail: "Email: {{email}}",
        location: "Location: {{location}}",
        disclaimer: "This is informational. For legal advice, consult a professional.",
        contactWhatsapp: "Contact support on WhatsApp",
        whatsappMessage: "Hi, I need help with Prime Buy.",
        whatsappMessageShipping: "Hi, I need help with shipping methods at Prime Buy.",
        whatsappMessageReturns: "Hi, I need help with returns at Prime Buy.",
        whatsappMessageWarranty: "Hi, I need help with warranties at Prime Buy.",
      },

      faq: {
        title: "Frequently Asked Questions",
        intro: "Here are common questions about shopping, payments, proof of payment, and shipping.",
        sections: {
          paymentsTitle: "1. Available payments",
          paymentsText:
            "We offer payment methods in USD and VES depending on availability. Some methods may require proof for verification.",
          proofTitle: "2. Proof & verification",
          proofText:
            "Some payments require proof and manual review. We will notify you if we need additional information.",
          shippingTitle: "3. Shipping & delivery",
          shippingText:
            "We operate only within Venezuela. Delivery times are estimates and depend on the shipping method.",
          stockTitle: "4. Availability & stock",
          stockText:
            "Availability may change. If an item runs out, we will contact you with alternatives or a refund if applicable.",
          supportTitle: "5. Support",
          supportText:
            "You can contact us via WhatsApp or email for assistance with orders, payments, or shipping.",
        },
      },

      shipping: {
        title: "Shipping Methods",
        intro: "Information about our shipping options within Venezuela.",
        scope: "Tracking depends on the logistics provider (e.g., MRW, ZOOM) when applicable.",
        sections: {
          methodsTitle: "1. Shipping options",
          methodsText:
            "We may offer local delivery (delivery) or nationwide shipping through courier agencies depending on the area.",
          timesTitle: "2. Estimated times",
          timesText:
            "Times are estimates and may vary due to availability, location, and carrier logistics.",
          trackingTitle: "3. Tracking",
          trackingText:
            "If the shipment includes a tracking number, we will share it so you can track it with the corresponding provider.",
          addressTitle: "4. Address & recipient details",
          addressText:
            "Please provide a complete address, reference, and phone number. Missing details can delay delivery.",
        },
      },

      returns: {
        title: "Return Policy",
        intro: "General conditions for return or exchange requests.",
        scope: "Returns are evaluated case by case depending on the product and its condition.",
        sections: {
          eligibilityTitle: "1. Eligibility",
          eligibilityText:
            "To request a return, the product must be unused, with packaging and accessories, and within the period informed by support.",
          exclusionsTitle: "2. Exclusions",
          exclusionsText:
            "Some products may not be eligible (e.g., consumables, installed items, or items with signs of use).",
          processTitle: "3. Process",
          processText:
            "Contact us on WhatsApp with your order number, reason, and evidence (if applicable). We will guide you through the next steps.",
        },
      },

      warranty: {
        title: "Warranties",
        intro: "General information about warranties and post-sale support.",
        scope: "Warranty may vary by product and/or manufacturer. Validation is subject to review.",
        sections: {
          coverageTitle: "1. Coverage",
          coverageText:
            "Warranty covers manufacturing defects within the applicable period. Evidence and evaluation are required.",
          exclusionsTitle: "2. Not covered",
          exclusionsText:
            "Not covered: misuse, impact damage, humidity, incorrect installation, manipulation, or normal wear.",
          processTitle: "3. How to request",
          processText:
            "Message us on WhatsApp with your order number, issue description, and photos/videos. We will provide the procedure.",
        },
      },
    }
  },
};