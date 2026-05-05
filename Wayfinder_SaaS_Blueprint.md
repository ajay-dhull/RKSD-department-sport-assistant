# Wayfinder.AI: Multi-Tenant SaaS Platform Blueprint

## Overview
Wayfinder.AI is a B2B SaaS platform that enables institutions (Colleges, Universities, Courts, Corporate Offices, etc.) to automatically generate and manage their own custom AI Voice/Chat Assistant and a dedicated Admin Panel. The platform follows a "DIY Onboarding" model where an institution signs up, provides its structural details, and the AI handles the UI/Logic generation.

## 1. Multi-Tenant Architecture
*   **Data Isolation**: Using a PostgreSQL database (Supabase/Neon) with Row-Level Security (RLS). Every table (Staff, Departments, FAQs, Announcements, Assistant Settings) is keyed by a unique `institution_id`.
*   **Unique Identity**: Each institution receives a unique `inst_id` (e.g., `rksd-college`) used for routing and authentication.
*   **Scalability**: A single codebase serves all institutions, but each sees only their own data and a UI structure customized to their needs.

## 2. Onboarding & AI-Driven UI Generation
*   **Step-by-Step Onboarding**: A comprehensive form collecting:
    *   Basic Details (Name, Location, Logo).
    *   Institution Type (Educational, Judicial, Medical, Corporate).
    *   Structural Information (Number of departments, type of users, primary services).
*   **Dynamic UI Engine**: Instead of fixed dashboards, the AI analyzes the institution's data to generate a `ui_config` JSON.
    *   *Example*: If a "Court" is selected, the sidebar includes 'Case Management', 'Hearing Schedules', and 'Legal Research'. If a "College" is selected, it shows 'Course Management', 'Admissions', and 'Hostel Details'.
*   **Structure Editor**: Institutions can customize their panel structure, changing names, icons, and menu hierarchy without writing code.

## 3. The AI Assistant Ecosystem
*   **Isolated Knowledge Base**: Institutions upload documents, text, or links. The AI Assistant only answers based on that institution's specific data.
*   **Unique Public Links**: Each assistant is hosted on a unique URL (e.g., `wayfinder.ai/assistant/rksd-college`) for public use.
*   **Voice & Chat**: Real-time natural language interaction with multi-lingual support (Hindi/English).

## 4. Admin Panel Features
*   **Manual & AI Data Entry**: Admins can manually add information or use AI to parse complex documents (DOCX/PDF) into the structured database.
*   **Role-Based Access**: Primary institution admins can create 'Mini-Admins' for specific departments.
*   **System Customization**: Control over assistant personality, primary language, and theme colors.

## 5. Subscription & Payment System
*   **Tiered Plans**: 
    *   Free Trial (30 Days).
    *   Paid Tiers (Monthly, Yearly, 5-Year).
*   **Automated Credentialing**: Upon successful payment, a unique `inst_id` and temporary password are generated and sent via email.
*   **Password Management**: Integrated self-service password reset via registered email.

## 6. Technical Stack
*   **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Radix UI.
*   **Backend**: Node.js/Express, Drizzle ORM, PostgreSQL.
*   **AI**: OpenAI/Groq (for logic), Cartesia/Web Speech API (for TTS), Whisper (for STT).
*   **Auth**: Custom JWT-based multi-tenant authentication.
