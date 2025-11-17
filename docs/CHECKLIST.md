# Frontend Screens - Online Auction Platform

## 1. Guest / Anonymous User

### Home
- Top 5 products that are ending soon
- Top 5 products with the most bids
- Top 5 highest-priced products
- Display banners and featured categories

### Category Listing
- Product list by category (with pagination)
- Filters and sorting by price / time left
- Highlight newly posted products
- Clicking a category opens the product list for that category

### Search
- Search by product name or category
- Full-text search that ignores Vietnamese diacritics
- Pagination and user-controlled sorting

### Product Detail
- Main image + additional images (≥ 3)
- Title, current price, buy-now price (if available)
- Seller info & current highest bidder (masked)
- Posted time and end time (show relative time if < 3 days)
- Detailed description
- Auction history (masked bidder info)
- Q&A section (questions & answers)
- 5 related products from the same category
- "Login / Register" button shown when not logged in

### Register
- Registration form: full name, email, address, password, email OTP
- reCaptcha integration
- Validation error messages

### Login
- Login form (email, password)
- OAuth providers: Google / Facebook / GitHub / Twitter
- Forgot password link

---

## 2. Bidder / Buyer

### Dashboard / Profile
- Personal information
- Rating score and details of received ratings
- Change password
- View favorite (watch) list
- View items currently bidding on
- View items won and leave feedback for sellers

### Watch List
- Display saved products
- Pagination and remove item from watch list

### Product Detail (authenticated)
- Same as guest view
- Place a bid
- Show valid bid suggestions
- Send questions to the seller
- Show bid confirmation notifications

### Auction History
- Timeline table with bidders (masked) and bid amounts

### Order Completion / Checkout
- Payments: MoMo / ZaloPay / VNPay / Stripe / PayPal
- Enter shipping address
- Confirm receipt of goods
- Leave feedback for the transaction
- Chat interface with the seller

### Request to become a Seller
- Form to submit an upgrade request to admin

---

## 3. Seller

### Dashboard / Profile
- List of active listings
- List of items that have a winner
- View transaction history and ratings

### Create Auction Listing
- Form fields: title, starting price, bid increment, buy-now price
- Upload ≥ 3 images
- Product description (WYSIWYG)
- Auto-extend settings

### Product Detail (owner view)
- View details of own listing
- Answer buyer questions
- Reject bidders
- Append to description (append-only)
- Cancel transaction and rate bidder if needed

### Listings Management
- Filters: active / expired listings
- Edit description and auto-extend settings

### Order Management
- Confirm receipt of payment, provide shipping invoice
- Chat with the winner
- Cancel transaction if necessary

---

## 4. Admin

### Admin Dashboard
- Charts: new listings, revenue, new users
- Statistics for bidder→seller upgrades
- Other relevant metrics

### Category Management
- Create / Update / Delete categories (cannot delete if products exist)

### Product Management
- Product list
- View product details
- Remove / take down product

### User Management
- List bidders / sellers / guests
- View, edit, delete users
- Approve bidder → seller upgrade requests

---

## 5. Shared / Auxiliary Screens
- Change password form
- Forgot password / OTP forms
- Header / Navigation
- Footer
- Notifications / Toasts (success / error)
- Modal / Confirm Dialog (confirm bid, delete product, etc.)

# Backend API - Online Auction Platform

## 1. Guest (Unauthenticated) Endpoints

### Menu & Categories
- `GET /categories` — return nested categories (2 levels)
- `GET /categories/:id/products` — return products for a category (paginated)

### Home
- `GET /products/top-ending` — top 5 products ending soon
- `GET /products/top-bid-count` — top 5 products by bid count
- `GET /products/top-price` — top 5 highest-priced products

### Product Listing
- `GET /products` — filter by category, pagination, sorting
- `GET /products/search` — full-text search (Vietnamese diacritics-insensitive), filtering, sorting, pagination

### Product Detail
- `GET /products/:id` — product details
- `GET /products/:id/history` — auction history
- `GET /products/:id/questions` — Q&A list
- `GET /products/:id/related` — 5 related products in the same category

### Registration
- `POST /auth/register` — register account (reCaptcha, bcrypt/scrypt, email OTP)
- `POST /auth/verify-otp` — verify email OTP

---

## 2. Bidder (Authenticated Buyer) Endpoints

### Watch List
- `POST /wishlist` — add product to watch list
- `GET /wishlist` — get watch list
- `DELETE /wishlist/:productId` — remove product from watch list

### Bidding
- `POST /products/:id/bid` — place a bid (check rating, validate bid amount, confirm)

### Auction History
- `GET /products/:id/bids` — view auction history (mask bidder info)

### Questions to Seller
- `POST /products/:id/questions` — post a question
- Backend triggers email notifications to the seller

### Profile Management
- `GET /profile` — get personal information
- `PUT /profile` — update profile
- `PUT /profile/password` — change password
- `GET /profile/bids` — items currently bidding on
- `GET /profile/wins` — items won and feedback for sellers

### Request Seller Upgrade
- `POST /upgrade-request` — submit upgrade request
- `PUT /upgrade-request/:id/approve` — admin approves upgrade

---

## 3. Seller Endpoints

### Create Listing
- `POST /products` — create auction listing
- `PUT /products/:id` — append additional description
- Support WYSIWYG editor, upload ≥ 3 images, auto-extend settings

### Reject Bidder
- `POST /products/:productId/reject-bidder/:bidderId` — reject bidder

### Answer Questions
- `POST /products/:id/questions/:questionId/answer` — answer question

### Profile & Listings
- `GET /profile/products` — list of own listings
- `GET /profile/products/wins` — list of won items
- APIs to rate winners or cancel transactions

---

## 4. Admin Endpoints

### Category Management (CRUD)
- `GET /categories`
- `POST /categories`
- `PUT /categories/:id`
- `DELETE /categories/:id` — disallow delete if products exist

### Product Management
- `DELETE /products/:id` — remove product

### User Management
- CRUD users
- `GET /upgrade-requests` — list upgrade requests
- `PUT /upgrade-requests/:id/approve` — approve upgrade

### Dashboard
- APIs for counts: listings, revenue, users, bidder→seller upgrades

---

## 5. Common Features
- `POST /auth/login` — login (supports OAuth)
- `PUT /profile` — update profile
- `PUT /profile/password` — change password
- `POST /auth/forgot-password` — email OTP

---

## 6. System Components

### Mailing System
- Trigger emails for events: successful bid, auction end, questions, answers

### Automated Bidding
- `POST /products/:id/auto-bid` — set max auto-bid amount
- Backend logic updates product price based on auto-bid settings

---

## 7. Payment Flow
- `POST /orders/:id/pay` — initiate payment
- `PUT /orders/:id/shipping` — submit shipping address
- `PUT /orders/:id/confirm-payment` — confirm invoice/payment received
- `PUT /orders/:id/confirm-receive` — confirm receipt of goods
- `POST /orders/:id/rate` — rate the transaction

---

## 8. Technical Requirements
- Backend: RESTful API, JWT AccessToken + RefreshToken
- Full validation and Swagger/OpenAPI documentation
- Logging & monitoring: Grafana or ELK stack
- Frontend: SPA (client-side rendering), Flux-like architecture, form validation, state management

``` 
