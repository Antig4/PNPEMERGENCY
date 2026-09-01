# PNP EmergencyLink Central Backend API

A robust, centralized **Laravel 13 REST API** and **PostgreSQL / PostGIS** backend for the **PNP EmergencyLink** system. The backend acts as the single source of truth for Citizen emergency reporting, Patrol Officer real-time dispatch management, spatial GIS nearest-responder routing, and status history auditing.

---

## 🛠️ Technology Stack

* **Framework:** Laravel 13.x
* **Language:** PHP 8.2+
* **Database:** PostgreSQL with **PostGIS** spatial extension (`ST_Distance`, `ST_MakePoint`, `geography` types)
* **Authentication:** Laravel Sanctum (Bearer Token Authorization)
* **Architecture:** Controller-Service-Resource Pattern with server-authoritative status state machine

---

## 🗄️ Database Schema & PostGIS Integration

The database is designed with 6 core tables with PostGIS geography indexing:

1. **`users`**: Central user accounts (Roles: `CITIZEN`, `PATROL_OFFICER`, `STATION_USER`, `ADMIN`).
2. **`police_stations`**: Police station desks with PostGIS spatial point location (`location`).
3. **`patrol_officers`**: Officer records tied to `users` and `police_stations`. Includes live GPS coordinates (`current_latitude`, `current_longitude`, `current_location` geography column) and availability status (`AVAILABLE`, `RESPONDING`, `ON_SCENE`, `OFF_DUTY`, `OFFLINE`).
4. **`incidents`**: Central emergency reports (`reference_number` e.g., `INC-000001`, `emergency_type`, `latitude`, `longitude`, `location` PostGIS geography, `status`, `assigned_patrol_id`, `assigned_station_id`, timestamps).
5. **`incident_status_histories`**: Audit log of every status transition (`NEW` -> `NOTIFIED` -> `ACCEPTED` -> `RESPONDING` -> `ON_SCENE` -> `RESOLVED`), changed by user, timestamp, and remarks.
6. **`patrol_location_histories`**: High-frequency breadcrumb GPS tracking stored while an officer is actively `RESPONDING` or `ON_SCENE`.

---

## 🛰️ GIS Dispatch Engine (`DispatchService`)

When an emergency report is submitted:
1. Calculates the spatial distance between the incident coordinates and all `AVAILABLE` patrol officers using PostGIS `ST_Distance(current_location, ST_MakePoint(lng, lat)::geography)`.
2. Finds the nearest active police station as regional fallback.
3. If an `AVAILABLE` patrol officer is found:
   - Assigns `assigned_patrol_id`.
   - Transitions status to `NOTIFIED`.
   - Records status history entry with calculated distance in kilometers.
4. If no `AVAILABLE` patrol officer is within range:
   - Assigns `assigned_station_id` to nearest station desk for manual dispatch.
   - Transitions status to `NOTIFIED`.
5. Supports automatic **re-dispatching** when a patrol officer declines an assignment with a required reason.

---

## 🔒 State Machine & Status Lifecycle

Valid status transitions are strictly enforced on the server:

```
[NEW] ──> [NOTIFIED] ──> [ACCEPTED] ──> [RESPONDING] ──> [ON_SCENE] ──> [RESOLVED]
              │               │               │              │
              ├──> [DECLINED] └──> [CANCELLED]└──>[CANCELLED]└──>[CANCELLED]
              └──> [CANCELLED]
```

* When an officer accepts: Incident -> `ACCEPTED`, Officer availability -> `RESPONDING`.
* When officer marks on scene: Incident -> `ON_SCENE`, Officer availability -> `ON_SCENE`.
* When officer resolves: Incident -> `RESOLVED`, Officer availability -> restored to `AVAILABLE`.

---

## 🚀 Environment Setup & Installation

### 1. Database Setup (PostgreSQL + PostGIS)
Ensure PostgreSQL and PostGIS are installed:
```sql
CREATE DATABASE pnp_emergencylink;
\c pnp_emergencylink
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

### 2. Configure `.env`
```env
APP_NAME="PNP EmergencyLink API"
APP_ENV=local
APP_KEY=base64:...
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=pnp_emergencylink
DB_USERNAME=postgres
DB_PASSWORD=postgres
```

### 3. Run Migrations & Seeders
```bash
php artisan migrate:fresh --seed
```

This seeds:
* **Police Stations:** Station 1 (Central Desk), Station 2 (Ampayon Desk), Station 3 (Libertad Desk).
* **Patrol Officers:** 4 demo officers (`BCPO-99421`, `BCPO-99422`, `BCPO-99423`, `BCPO-99424`) with password `patrolpass123`.
* **Citizen Account:** `citizen@emergencylink.ph` / `09171234567` / password `citizenpass123`.

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new citizen | Public |
| `POST` | `/api/auth/login` | Login using email (Citizen) or Badge ID (Patrol) | Public |
| `POST` | `/api/auth/logout` | Revoke active Sanctum token | Bearer |
| `GET`  | `/api/auth/me` | Return authenticated user & patrol details | Bearer |

### Citizen Endpoints (`/api/citizen`) — *Requires `role:CITIZEN`*
| Method | Endpoint | Description |
|---|---|---|
| `GET`  | `/api/citizen/profile` | Retrieve citizen profile |
| `POST` | `/api/incidents` | Report emergency (triggers GIS Dispatch) |
| `GET`  | `/api/citizen/incidents` | History of reported emergencies |
| `GET`  | `/api/citizen/active-incident` | Current ongoing emergency report |
| `GET`  | `/api/incidents/{id}` | Detailed incident view |

### Patrol Officer Endpoints (`/api/patrol`) — *Requires `role:PATROL_OFFICER`*
| Method | Endpoint | Description |
|---|---|---|
| `GET`  | `/api/patrol/profile` | Officer profile & station details |
| `PATCH`| `/api/patrol/status` | Update availability status (`AVAILABLE`, `OFF_DUTY`, `OFFLINE`) |
| `GET`  | `/api/patrol/active-incident` | Currently assigned active incident |
| `GET`  | `/api/patrol/incidents` | Incident response history |
| `POST` | `/api/patrol/incidents/{id}/accept` | Accept incident dispatch |
| `POST` | `/api/patrol/incidents/{id}/decline` | Decline incident dispatch (requires `reason`) |
| `PATCH`| `/api/patrol/incidents/{id}/status` | Update status (`RESPONDING`, `ON_SCENE`) |
| `POST` | `/api/patrol/incidents/{id}/resolve` | Resolve incident (`resolution_summary`, `resolution_outcome`) |
| `POST` | `/api/patrol/location` | Broadcast live GPS coordinates (`latitude`, `longitude`, `accuracy`) |

---

## 🧪 Automated Testing

Execute the PHPUnit feature test suite:
```bash
php artisan test
```

### Test Coverage:
* `AuthTest.php`: Citizen registration, login, badge ID authentication, role authorization.
* `DispatchTest.php`: Automated PostGIS nearest patrol routing, distance calculation, fallback to police station.
* `PatrolTest.php`: Accept, decline, status state machine, resolution, GPS location tracking history.
