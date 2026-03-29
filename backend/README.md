# SITA Backend

Node.js + Express + Socket.IO + PostgreSQL backend for the SITA tricycle ride-hailing app.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your database credentials and JWT secret.

### 3. Create the database
```bash
createdb sita_db
psql -U postgres -d sita_db -f src/db/schema.sql
```

### 4. Start development server
```bash
npm run dev
```

Server runs on `http://localhost:3000`
Socket.IO runs on `ws://localhost:3000`

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/customer/register | Register customer |
| POST | /api/auth/customer/login | Customer login |
| POST | /api/auth/driver/register | Register driver |
| POST | /api/auth/driver/login | Driver login |
| POST | /api/auth/admin/login | Admin login |
| GET | /api/auth/me | Get current user |
| GET | /api/users/:id | Get customer profile |
| PUT | /api/users/:id | Update customer profile |
| GET | /api/users/:id/rides | Customer ride history |
| GET | /api/users/:id/wallet | Customer wallet |
| GET | /api/drivers/active | All online drivers |
| GET | /api/drivers/:id | Driver profile |
| PATCH | /api/drivers/:id/location | Update driver location |
| PATCH | /api/drivers/:id/status | Toggle online/offline |
| GET | /api/drivers/:id/earnings | Driver earnings |
| POST | /api/rides | Create ride request |
| GET | /api/rides/:id | Get ride details |
| PATCH | /api/rides/:id/accept | Accept ride (driver) |
| PATCH | /api/rides/:id/arrived | Mark arrived at pickup |
| PATCH | /api/rides/:id/start | Start the trip |
| PATCH | /api/rides/:id/complete | Complete trip |
| PATCH | /api/rides/:id/cancel | Cancel ride |
| PATCH | /api/rides/:id/rate | Rate the ride |
| GET | /api/admin/dashboard | Admin dashboard stats |
| GET | /api/admin/pending-verifications | Pending driver verifications |
| PATCH | /api/admin/verify-driver | Approve/reject driver |
| GET | /api/admin/users | All customers |
| GET | /api/admin/drivers | All drivers |
| GET | /api/admin/rides | All rides |

## Socket.IO Events

### Driver → Server
| Event | Payload |
|-------|---------|
| driver:online | `{ driverId, latitude, longitude }` |
| driver:location | `{ driverId, latitude, longitude, speed?, heading? }` |
| driver:accept-ride | `{ driverId, rideId }` |
| driver:start-ride | `{ driverId, rideId }` |
| driver:complete-ride | `{ driverId, rideId }` |
| driver:offline | `{ driverId }` |

### Customer → Server
| Event | Payload |
|-------|---------|
| ride:request | `{ customerId, pickupLatitude, pickupLongitude, dropoffLatitude, dropoffLongitude, pickupAddress, dropoffAddress }` |
| customer:watch-drivers | (none) |
| ride:watch | `{ driverId }` |
| ride:leave | `{ rideId }` |

### Server → Client
| Event | Description |
|-------|-------------|
| online:confirmed | Driver is now online |
| driver:location-update | Broadcast driver location |
| driver:arrived-at-pickup | Driver arrived (geofence) |
| driver:near-dropoff | Near destination (geofence) |
| ride:available | New ride available (to drivers) |
| ride:driver-accepted | Driver accepted (to customer) |
| ride:started | Ride in progress |
| ride:completed | Ride done |
| ride:status-update | Status changed |
| drivers:snapshot | All active drivers list |

## Default Admin
- Username: `superadmin`
- Password: `Admin@SITA2024`
- **Change this immediately after first login!**
