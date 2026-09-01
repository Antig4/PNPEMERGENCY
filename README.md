# PNP EmergencyLink — Public Safety & Emergency Response Platform 🚓🚨

**PNP EmergencyLink** is an integrated emergency response and geospatial tracking platform designed for the Philippine National Police (PNP). The platform connects Citizens, Mobile Patrol Units, and Command Center Administrators in real-time.

---

## 🏗️ System Architecture

The system consists of three core components:

1. **Laravel REST API Backend (`/backend`)**: Manages database persistence, authentication (Sanctum), incident lifecycle management, and spatial calculations.
2. **Admin Command Center Web App (`/admin-web`)**: Built with React, Vite, TailwindCSS, and Leaflet. Provides live dispatch monitoring, responder routing, and GIS density heatmaps.
3. **Citizen & Responder Mobile Application (`/`)**: Built with Expo (React Native). Enables one-touch emergency reporting, real-time officer GPS tracking, evidence uploads, and patrol unit dispatch workflows.

---

## 📋 Prerequisites

Before running the project, ensure you have the following installed on your machine:

- **PHP**: `>= 8.2`
- **Composer**: `>= 2.0`
- **Node.js**: `>= 18.x` & `npm`
- **Git**

---

## 🚀 How to Run the System (Step-by-Step Guide)

To run the full system locally so that both **Web Admin** and **Mobile App/APK** work together seamlessly, follow these steps in order.

### Step 1: Start the Backend REST API Server

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install PHP dependencies:
   ```bash
   composer install
   ```
3. Initialize the database and run seeders (Populates stations, patrol officers, and admin accounts):
   ```bash
   php artisan migrate:fresh --seed
   ```
4. **IMPORTANT**: Start the server bound to `0.0.0.0` so physical phones on Wi-Fi can connect:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```
   > 💡 *The backend is now accessible locally at `http://localhost:8000/api` and over LAN at `http://<YOUR_COMPUTER_IP>:8000/api`.*

---

### Step 2: Start the Admin Web Dashboard

1. Open a new terminal window and navigate to the admin web directory:
   ```bash
   cd admin-web
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the Admin Command Center in your browser:
   ```text
   http://localhost:3000
   ```

---

### Step 3: Run the Mobile Application (App & APK)

#### Option A: Running in Development (Expo Server)
1. Open a new terminal window in the root directory:
   ```bash
   npx expo start
   ```
2. Press `w` to open in a web browser, or scan the QR code with **Expo Go** on your physical Android phone (ensure your phone is connected to the same Wi-Fi network).

#### Option B: Building & Running Physical Android APK
1. Ensure your current computer IP address (e.g. `192.168.1.148`) is updated in `app.json` under `extra.EXPO_PUBLIC_API_URL`:
   ```json
   "extra": {
     "EXPO_PUBLIC_API_URL": "http://192.168.1.148:8000/api"
   }
   ```
2. Ensure `"usesCleartextTraffic": true` is enabled in `app.json` under `"android"`.
3. Build the APK locally or via EAS:
   ```bash
   eas build -p android --profile preview
   ```
4. Install the generated `.apk` file directly onto your Android device.

---

## 🔑 Default Login Credentials

| User Role | Email / Badge Number | Password | Target Interface |
| :--- | :--- | :--- | :--- |
| **Admin Command Center** | `admin@emergencylink.ph` | `adminpass123` | Admin Web (`http://localhost:3000`) |
| **Patrol Officer 01** | `BCPO-99421` *(or `patrol01@emergencylink.ph`)* | `patrolpass123` | Mobile App / APK |
| **Patrol Officer 02** | `BCPO-99422` *(or `patrol02@emergencylink.ph`)* | `patrolpass123` | Mobile App / APK |
| **Citizen Account** | `citizen@emergencylink.ph` | `citizenpass123` | Mobile App / APK |

---

## 🌐 24/7 Cloud Deployment Note

*When running locally, your computer must be turned **ON** and connected to the same Wi-Fi as your phone for the APK to send reports.*

To run the system **24/7 without keeping your PC on**:
1. Deploy `/backend` and SQLite/MySQL to a cloud host (Render, Railway, or VPS).
2. Deploy `/admin-web` to Vercel or Netlify.
3. Update `app.json` with your live HTTPS API URL (e.g. `https://api.pnpemergencylink.ph/api`) and build the final APK.

---

## 🛡️ License & Credits
Developed for the Philippine National Police (BCPO Headquarters) Emergency Dispatch & GIS Tracking System.
