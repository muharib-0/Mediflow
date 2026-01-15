# Mini Hospital Management System (HMS)

A comprehensive web application for managing doctor availability and patient appointments with Google Calendar integration and serverless email notifications.

## Tech Stack
- **Backend**: Django 5.x
- **Database**: PostgreSQL (configured) / SQLite (default)
- **Frontend**: Bootstrap 5 + Modern CSS
- **Email Service**: AWS Lambda (Serverless Framework)
- **Integration**: Google Calendar API

## Features
- **Role-based Authentication**: Separate portals for Doctors and Patients.
- **Doctor Dashboard**: Manage availability slots (single/bulk add), view appointments.
- **Patient Dashboard**: Browse doctors by specialization, book appointments.
- **Race Condition Handling**: Prevents double booking of the same slot.
- **Google Calendar Sync**: Automatically adds appointments to both doctor's and patient's calendars.
- **Email Notifications**: Serverless function to send welcome and confirmation emails.

## Setup Instructions

### 1. Backend Setup

1. **Install Dependencies**:
   ```bash
   python -m venv venv
   .\venv\Scripts\activate
   pip install -r hms/requirements.txt
   ```

2. **Environment Variables**:
   - Rename `hms/.env.example` to `hms/.env`
   - Update the configuration (Database, Google OAuth credentials, etc.)

3. **Database Migrations**:
   ```bash
   cd hms
   python manage.py migrate
   ```

4. **Create Superuser**:
   ```bash
   python create_superuser_standalone.py
   # Default: admin@example.com / admin123
   ```

5. **Run Server**:
   ```bash
   python manage.py runserver
   ```
   Access at `http://localhost:8000`

### 2. Serverless Email Service Setup (Optional)

1. **Prerequisites**: Node.js and Serverless Framework installed.
   ```bash
   npm install -g serverless
   ```

2. **Install Dependencies**:
   ```bash
   cd email_service
   npm install
   ```

3. **Run Locally**:
   ```bash
   serverless offline
   ```
   The service will run at `http://localhost:3000`. Ensure `EMAIL_SERVICE_URL` in Django `.env` matches this.

### 3. Google Calendar Integration

1. Go to Google Cloud Console and create a project.
2. Enable Google Calendar API.
3. Create OAuth 2.0 Credentials.
4. Add `http://localhost:8000/calendar/oauth2callback/` to Authorized Redirect URIs.
5. Download credentials and update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`.

## Usage Guide

### For Doctors
- Sign up as a Doctor.
- Complete your profile (Specialization, Fee, etc.).
- Go to "Availability" to add slots.
- Use "Bulk Add" to quickly create slots for a day.
- Connect Google Calendar from Profile page for sync.

### For Patients
- Sign up as a Patient.
- Browse Doctors by specialization/name.
- Select a doctor and choose an available slot.
- Confirm booking.
- View upcoming appointments in Dashboard.
