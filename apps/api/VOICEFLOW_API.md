# 🤖 Voiceflow API Integration - Endpoints Documentation

## Overview
This document provides complete examples for testing the Voiceflow integration endpoints.

All endpoints require the `X-Voiceflow-API-Key` header for authentication.

---

## 🔑 Authentication

**Header Required:**
```
X-Voiceflow-API-Key:
```

---

## 📋 Endpoints

### 1. Search Products

**Search for products by name (case-insensitive)**

```http
GET /api/voiceflow/products/search?q={searchTerm}
```

#### Request Examples

**Using cURL:**
```bash
curl -X GET "http://localhost:3000/api/voiceflow/products/search?q=laptop" \
  -H "X-Voiceflow-API-Key:
```

**Using Postman:**
- Method: `GET`
- URL: `http://localhost:3000/api/voiceflow/products/search?q=laptop`
- Headers:
  - `X-Voiceflow-API-Key`:

#### Success Response (Products Found)
```json
{
  "success": true,
  "found": true,
  "customerMessage": "Encontré 2 productos con \"laptop\"",
  "data": {
    "products": [
      {
        "id": "1",
        "nameES": "Laptop Pro",
        "priceUSD": 1299.99,
        "priceVES": 111149.15,
        "inStock": true,
        "stock": 5
      },
      {
        "id": "2",
        "nameES": "Laptop Gaming",
        "priceUSD": 1899.99,
        "priceVES": 162399.15,
        "inStock": true,
        "stock": 3
      }
    ],
    "rate": {
      "rate": 85.50,
      "source": "BCV"
    }
  }
}
```

#### Success Response (No Products Found)
```json
{
  "success": true,
  "found": false,
  "customerMessage": "No encontré productos con \"xyz\". ¿Podrías intentar con otro término?",
  "data": {
    "products": []
  }
}
```

#### Error Response (Missing Query)
```json
{
  "success": false,
  "customerMessage": "Por favor proporciona un término de búsqueda.",
  "errorCode": "MISSING_QUERY"
}
```

---

### 2. Get Product by ID

**Get detailed information about a specific product**

```http
GET /api/voiceflow/products/:id
```

#### Request Examples

**Using cURL:**
```bash
curl -X GET "http://localhost:3000/api/voiceflow/products/1" \
  -H "X-Voiceflow-API-Key: 
```

**Using Postman:**
- Method: `GET`
- URL: `http://localhost:3000/api/voiceflow/products/1`
- Headers:
  - `X-Voiceflow-API-Key`: 

#### Success Response
```json
{
  "success": true,
  "customerMessage": "Laptop Pro está en stock (5 disponibles). Precio: $1299.99 USD (Bs. 111,149.15).",
  "data": {
    "product": {
      "id": "1",
      "nameES": "Laptop Pro",
      "priceUSD": 1299.99,
      "priceVES": 111149.15,
      "inStock": true,
      "stock": 5,
      "shortDescES": "Laptop de alto rendimiento para profesionales",
      "category": "Electronics"
    },
    "rate": {
      "rate": 85.50,
      "source": "BCV"
    }
  }
}
```

#### Error Response (Product Not Found)
```json
{
  "success": false,
  "found": false,
  "customerMessage": "No encontré ese producto. ¿Podrías verificar el ID?",
  "errorCode": "PRODUCT_NOT_FOUND"
}
```

---

### 3. Order Lookup

**Look up an order by orderId and email validation**

```http
POST /api/voiceflow/orders/lookup
```

#### Request Examples

**Using cURL:**
```bash
curl -X POST "http://localhost:3000/api/voiceflow/orders/lookup" \
  -H "X-Voiceflow-API-Key:
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "email": "cliente@example.com"
  }'
```

**Using Postman:**
- Method: `POST`
- URL: `http://localhost:3000/api/voiceflow/orders/lookup`
- Headers:
  - `X-Voiceflow-API-Key`: 
  - `Content-Type`: `application/json`
- Body (raw JSON):
```json
{
  "orderId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "cliente@example.com"
}
```

#### Success Response
```json
{
  "success": true,
  "found": true,
  "customerMessage": "Tu pedido está pagada. Envío: envío nacional - pendiente de despacho. Tracking: MRW123456789",
  "data": {
    "orderId": "550e8400-e29b-41d4-a716-446655440000",
    "status": "paid",
    "createdAt": "2026-04-02T10:30:00Z",
    "items": [
      {
        "name": "Laptop HP",
        "quantity": 1
      },
      {
        "name": "Mouse Logitech",
        "quantity": 2
      }
    ],
    "shipping": {
      "method": "national_shipping",
      "status": "pending",
      "carrier": {
        "name": "MRW",
        "trackingNumber": "MRW123456789"
      },
      "dispatchedAt": null,
      "deliveredAt": null
    },
    "totals": {
      "amountPaid": 959.97,
      "currency": "USD"
    }
  }
}
```

#### Error Response (Invalid Email)
```json
{
  "success": false,
  "found": false,
  "customerMessage": "El correo electrónico no coincide con esta orden. Por favor verifica los datos.",
  "errorCode": "INVALID_EMAIL"
}
```

#### Error Response (Order Not Found)
```json
{
  "success": false,
  "found": false,
  "customerMessage": "No encontré esa orden. Por favor verifica el número de pedido.",
  "errorCode": "ORDER_NOT_FOUND"
}
```

#### Error Response (Invalid Request)
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "orderId",
      "message": "orderId must be a valid UUID"
    }
  ]
}
```

---

## 🔐 Security Error Responses

### Missing API Key
```json
{
  "success": false,
  "message": "Missing X-Voiceflow-API-Key header",
  "errorCode": "MISSING_API_KEY"
}
```

### Invalid API Key
```json
{
  "success": false,
  "message": "Invalid API key",
  "errorCode": "INVALID_API_KEY"
}
```

---

## 📊 Response Field Reference

### Product Fields
- `id`: Product ID (string)
- `nameES`: Product name in Spanish
- `priceUSD`: Price in USD (number)
- `priceVES`: Price in VES (number, nullable if no exchange rate available)
- `inStock`: Boolean indicating availability
- `stock`: Exact quantity available (number)
- `shortDescES`: Short description in Spanish (nullable)
- `category`: Product category

### Order Fields
- `orderId`: Unique order identifier (UUID)
- `status`: Order status (`paid`, `completed`, `cancelled`)
- `createdAt`: ISO 8601 timestamp
- `items`: Array of order items (name and quantity only)
- `shipping.method`: Shipping method (`pickup`, `local_delivery`, `national_shipping`)
- `shipping.status`: Shipping status (`pending`, `dispatched`, `delivered`)
- `shipping.carrier.name`: Carrier name (e.g., `MRW`, `ZOOM`)
- `shipping.carrier.trackingNumber`: Tracking number (nullable)
- `totals.amountPaid`: Total amount paid
- `totals.currency`: Currency code (`USD`, `VES`)

### Exchange Rate Fields
- `rate`: Exchange rate value (1 USD = X VES)
- `source`: Rate source (e.g., `BCV`, `manual`)

---

## 🧪 Testing Checklist

- [ ] Test search with existing product name
- [ ] Test search with non-existing product
- [ ] Test search with empty query
- [ ] Test get product by valid ID
- [ ] Test get product by invalid ID
- [ ] Test order lookup with correct email
- [ ] Test order lookup with incorrect email
- [ ] Test order lookup with invalid orderId format
- [ ] Test all endpoints without API key
- [ ] Test all endpoints with invalid API key

---

## 🌐 Production URLs

When deployed to production (Render):
- Base URL: `https://primebuy-staging-api.onrender.com`
- Example: `https://primebuy-staging-api.onrender.com/api/voiceflow/products/search?q=laptop`

---

## 📝 Notes

1. **Email validation is case-insensitive** - `CLIENTE@EXAMPLE.COM` matches `cliente@example.com`
2. **Product search is case-insensitive** - searches across `name`, `nameES`, and `nameEN` fields
3. **Sensitive data is excluded** - Order lookups do not return full addresses or payment references
4. **Exchange rates** - If no rate is available, `priceVES` and `rate` will be `null`
5. **customerMessage** - Always present for easy chatbot integration

---

## 🔧 Environment Variables

Required in `.env`:
```bash
VOICEFLOW_API_KEY=
```

This key is automatically validated in production environments.
