# 🛍️ ShopNest

<div align="center">

### Modern Full-Stack E-Commerce Platform

A feature-rich MERN Stack e-commerce application built with React, Node.js, Express, MongoDB, Redux Toolkit, Socket.IO, and UPI-based payment integration.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb)
![Redux](https://img.shields.io/badge/Redux-Toolkit-764ABC?logo=redux)
![Socket.IO](https://img.shields.io/badge/Socket.IO-RealTime-010101?logo=socket.io)

### 🚀 Live Demo

https://shopnest-psi.vercel.app

</div>

---

## 📖 About The Project

ShopNest is a modern e-commerce platform inspired by leading online marketplaces. It provides users with a seamless shopping experience through secure authentication, product discovery, cart management, wishlist functionality, order tracking, analytics dashboards, and UPI-based payment processing.

The project demonstrates full-stack development skills using industry-standard technologies and scalable architecture.

---

## ✨ Features

### 👤 Customer Features

* Secure User Authentication
* Google OAuth Login
* Product Browsing & Search
* Category Filtering
* Product Details Page
* Shopping Cart
* Wishlist Management
* UPI Payment Checkout
* Order Placement
* Order Tracking
* Order History
* Responsive Design

### 🛠️ Admin Features

* Product Management
* Inventory Management
* Order Management
* User Management
* Sales Analytics Dashboard
* Revenue Insights

### ⚡ Real-Time Features

* Live Notifications
* Instant Order Updates
* Real-Time Communication using Socket.IO

### 💳 Payment System

* UPI-Based Payments
* QR Code Payment Support
* Payment Screenshot Upload
* Manual Payment Verification
* Secure Order Processing

---

## 🏗️ Tech Stack

### Frontend

* React 18
* Redux Toolkit
* React Router DOM
* Axios
* Tailwind CSS
* GSAP Animations
* Chart.js
* React ChartJS 2
* Socket.IO Client

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Google OAuth
* Socket.IO
* Nodemailer
* Express Validator

---

## 📂 Project Structure

```text
shopnest/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── utils/
│   │
│   └── package.json
│
├── server/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── config/
│   ├── services/
│   ├── utils/
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation

### Clone Repository

```bash
git clone https://github.com/junead20/shopnest.git
cd shopnest
```

### Install Dependencies

Frontend

```bash
cd client
npm install
```

Backend

```bash
cd ../server
npm install
```

---

## 🔐 Environment Variables

Create a `.env` file inside the server directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id

CLIENT_URL=http://localhost:3000

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

UPI_ID=your_upi_id
```

---

## 🚀 Running the Project

### Start Backend

```bash
npm run dev
```

### Start Frontend

```bash
cd client
npm start
```

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:5000
```

---

## 🔄 Application Flow

```text
User
 │
 ▼
Authentication
 │
 ▼
Browse Products
 │
 ▼
Add To Cart
 │
 ▼
Place Order
 │
 ▼
UPI Payment
 │
 ▼
Upload Payment Proof
 │
 ▼
Admin Verification
 │
 ▼
Order Confirmation
```

---

## 📡 API Overview

### Authentication

| Method | Endpoint           | Description   |
| ------ | ------------------ | ------------- |
| POST   | /api/auth/register | Register User |
| POST   | /api/auth/login    | Login User    |
| POST   | /api/auth/google   | Google Login  |
| GET    | /api/auth/profile  | User Profile  |

### Products

| Method | Endpoint          | Description     |
| ------ | ----------------- | --------------- |
| GET    | /api/products     | Get Products    |
| GET    | /api/products/:id | Product Details |
| POST   | /api/products     | Create Product  |
| PUT    | /api/products/:id | Update Product  |
| DELETE | /api/products/:id | Delete Product  |

### Orders

| Method | Endpoint        | Description   |
| ------ | --------------- | ------------- |
| POST   | /api/orders     | Create Order  |
| GET    | /api/orders     | Get Orders    |
| GET    | /api/orders/:id | Order Details |
| PUT    | /api/orders/:id | Update Order  |

### Payments

| Method | Endpoint                | Description          |
| ------ | ----------------------- | -------------------- |
| POST   | /api/payment/create     | Create Payment       |
| POST   | /api/payment/upload     | Upload Payment Proof |
| GET    | /api/payment/status/:id | Payment Status       |
| PUT    | /api/payment/verify/:id | Verify Payment       |


---

## 🌍 Deployment

### Frontend

* Vercel
* Netlify

### Backend

* Render
* Railway
* DigitalOcean

### Database

* MongoDB Atlas

---

## 🎯 Future Improvements

* AI Product Recommendations
* Advanced Product Filters
* Coupon & Discount System
* Multi-Vendor Marketplace
* Push Notifications
* Mobile App
* Dark Mode
* Multi-Language Support

---

## 🤝 Contributing

Contributions are welcome.

```bash
git checkout -b feature/new-feature

git commit -m "Added new feature"

git push origin feature/new-feature
```

Create a Pull Request.

---

## 👨‍💻 Author

**Mohammed Junead Baba**

GitHub: https://github.com/junead20

---

## ⭐ Support

If you found this project useful, please consider giving it a star on GitHub.

---

<div align="center">

Made with ❤️ using the MERN Stack

</div>
