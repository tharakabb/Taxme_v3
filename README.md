# TaxMe v3 - Local Setup Guide

TaxMe v3 is a comprehensive Income Tax Suite for Sri Lanka, built with React, Express, and SQLite.

## Prerequisites

- Node.js (v18 or higher)
- npm

## Installation

1. Clone the repository or download the source code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update the `GEMINI_API_KEY` if you want to use the AI-powered receipt scanning feature.

## Database Setup

Initialize the database with default categories:
```bash
npm run seed
```

## Running the App

### Development Mode
Runs the backend and frontend (via Vite middleware) concurrently:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

### Production Mode
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm run start
   ```

## Features

- **Tax Calculation**: YA 2025/2026 rules for Personal and Corporate tax.
- **Smart Upload**: Scan receipts using Gemini AI to automatically extract date, vendor, amount, and category.
- **Reports**: Generate comprehensive PDF tax reports with merged receipt attachments.
- **Financial Tracking**: Manage transactions, assets, and salary configurations.
