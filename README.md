APP DESCRIPTION
1. Privacy-First (Local Storage)
Complete Data Sovereignty: Your sensitive financial information never leaves your device. Unlike web-based calculators that may log entries, Taxme_v3 saves all data locally.
No Cloud Risk: By eliminating server-side storage, the app removes the risk of data breaches or third-party tracking of your income and expenses.

2. Tailored for the Sri Lankan Economy
Up-to-Date Tax Brackets: Built specifically to handle the latest Inland Revenue Department (IRD) regulations, including APIT (Advanced Personal Income Tax) and individual income tax slabs.
Localized Logic: Optimized for Sri Lankan financial standards, ensuring that calculations for reliefs, exemptions, and qualifying payments are accurate to local law.

3. Open-Source Transparency
Audit-Ready Code: As an open-source project on GitHub, the calculation logic is transparent. Anyone can verify that the math is correct and that there are no hidden "phone home" scripts.
Community Driven: Benefit from a tool that is constantly improved and vetted by other developers and tax professionals in the community.

4. All-in-One Financial Suite
Beyond Just a Calculator: It’s not just for a one-time calculation; it features a dedicated interface for financial statements and revenue/expense tracking, turning it into a mini-accounting tool.
Year-Round Utility: Use it daily to track expenses and monthly to forecast your tax liability, rather than scrambling at the end of the fiscal year.

5. Lightweight & Offline Capable
Work Anywhere: Because it doesn't rely on heavy cloud databases, the app is fast, responsive, and fully functional without an internet connection—perfect for managing finances on the go.

6. Free & Accessible
No Subscription Fees: Get professional-grade tax calculation and tracking features without the cost of proprietary accounting software.

"Professional Sri Lankan tax management with the privacy of an offline vault. Your data, your device, your peace of mind."

# TaxMe v3 - Local Setup Guide

TaxMe v3 is a comprehensive Income Tax Suite for Sri Lanka, built with React, Express, and SQLite.

## Prerequisites

- Node.js (v18 or higher) **Make sure you have installed node.js on your device.
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
