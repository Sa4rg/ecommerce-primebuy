# 🛒 Prime Buy — E-Commerce Platform

Prime Buy is a modern full-stack e-commerce platform built for real production usage.

The system supports customer shopping flows, checkout, payment processing, and administrative product and payment management.

This repository contains the **frontend web application**.

---

## ✨ Features

### Customer Features
- **Product catalog browsing**: Explore all available products.
- **Category filtering**: Narrow down products by specific categories.
- **Product search**: Quick search functionality for items.
- **Cart management**: Add, remove, and update items in the shopping cart.
- **Checkout flow**: Seamless multi-step checkout process.
- **Payment submission**: Support for various payment proofs.
- **Order tracking**: Monitor the status of current and past orders.
- **Account management**: Personal user profiles and settings.

### Admin Features
- **Payment review panel**: Verify and approve customer payments.
- **Order management**: Oversee the entire lifecycle of orders.
- **Product management**: (In progress) CRUD operations for products.
- **Inventory management**: (Planned) Real-time stock tracking.

---

## 🧱 Tech Stack

### Frontend
- **React**: UI library for building the interface.
- **React Router**: Client-side routing.
- **Context API**: Global state management (Auth, Cart).
- **TailwindCSS**: Utility-first CSS framework for styling.
- **Vite**: Modern frontend build tool.
- **Modular architecture**: Clean, feature-based organization.
- **JWT authentication**: Secure token-based access.
- **Cart persistence**: Local storage and server-side sync.
- **Responsive UI**: Optimized for mobile, tablet, and desktop.

### Backend
- **Node.js & Express**: Server-side runtime and framework.
- **MySQL**: Relational database for data integrity.
- **JWT auth**: Secure authentication system (httpOnly cookies).
- **Checkout & payments system**: Logic for processing transactions.
- **Order management**: API endpoints for order handling.
- **Admin APIs**: Secure routes for administrative tasks.

See [apps/api/README.md](../api/README.md) for backend documentation.

---

## 📂 Project Structure

```text
src/
├── features/
│   ├── auth/            # Login, Registration, JWT logic
│   ├── product-catalog/ # Product listings and filters
│   ├── shopping-cart/   # Cart state and UI components
│   ├── checkout/        # Checkout process steps
│   ├── payment/         # Payment submission logic
│   ├── orders/          # User order history
│   └── admin/           # Admin-only dashboards and tools
│
├── shared/
│   ├── components/      # Reusable UI elements (Buttons, Inputs)
│   ├── layout/          # Main wrappers (Navbar, Footer)
│   └── hooks/           # Custom utility hooks
│
├── context/
│   ├── AuthContext      # User session global state
│   └── CartContext      # Shopping cart global state
│
└── infrastructure/
    └── apiClient        # Axios/Fetch configuration for API calls

*Feature-driven architecture is used for scalability and maintainability.*

---

## 🔐 Authentication

- **JWT-based authentication**: Secure sessions via tokens.
- **Automatic refresh**: Handling token expiration gracefully.
- **Session persistence**: Users stay logged in across refreshes.
- **Secure logout**: Complete cleanup of local and server sessions.

---

## 🛒 Cart System

- **Guest cart support**: Shop without an initial account.
- **User cart persistence**: Saves items to the database for registered users.
- **Cart sync**: Merges guest cart with user cart after login.
- **Cart reset**: Automatic clearing after successful payment submission.

---

## 💳 Checkout Flow

1. **Cart review**: Final check of items and quantities.
2. **Checkout initialization**: Setting up order details.
3. **Payment method selection**: Choosing how to pay.
4. **Payment proof submission**: Uploading evidence of transaction.
5. **Admin confirmation**: Manual or automated verification.
6. **Order creation**: Finalizing the purchase in the system.

---

## 🧪 Development Approach

The project follows:
- **Test Driven Development (TDD)**: Ensuring reliability from the start.
- **Feature-based architecture**: Keeping logic encapsulated.
- **Modular component structure**: Maximizing reusability.
- **Production-quality standards**: No "demo-level" shortcuts; built for real-world traffic.

---

## 🚀 Running Locally

1. **Clone the repository**
2. **Install dependencies**:
   ```bash
   pnpm install

Run dev server:

Bash
pnpm dev


 ## Environment Variables
Create a .env file in the root directory:

Code snippet
VITE_API_BASE_URL=
📌 Current Development Focus
[ ] Checkout UI improvements

[ ] Admin product management (CRUD)

[ ] Product detail pages (PDP)

[ ] Catalog performance improvements

[ ] General UX polishing

[ ] Final production readiness audit

## 🤝 Contribution Guidelines
All development must:

Follow the rules defined in AGENTS.md.

Maintain architecture consistency (feature-driven).

Avoid breaking existing shopping or checkout flows.

Keep production-level standards for all code and documentation.

## 📄 License
Private commercial project.
All rights reserved. Unauthorized copying or distribution is strictly prohibited.