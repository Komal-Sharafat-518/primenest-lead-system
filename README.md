# PrimeNest Realty — AI Lead Qualification & Follow-Up System

An AI-powered automation system that captures, qualifies, scores, and follows up with real estate leads — built as a reusable, portfolio-quality engine.

> **Note:** PrimeNest Realty is a fictional demo business used to showcase this system. This is a portfolio project, not a real company.

## What It Does

- Captures incoming leads (web forms / webhooks)
- Validates input and detects duplicates
- Uses AI to analyze and extract key information from leads
- Scores leads 0–100 and classifies them as COLD / WARM / HOT
- Stores leads in a database (Supabase/PostgreSQL)
- Notifies sales staff of qualified leads
- Generates and sends personalized AI follow-up messages
- Applies safety rules to prevent spam (no follow-up after opt-out, reply, or max attempts)

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React / Vanilla JS, HTML, CSS |
| Backend / Database | Supabase (PostgreSQL) |
| Automation | n8n |
| AI | Gemini / OpenAI API |
| Email | Resend / Gmail API |
| Deployment | Vercel (frontend), n8n Cloud (automation) |

## Architecture Principles

This project is built to be **reusable across different real estate businesses**, not hardcoded for one client:

- Business-specific details (name, location, scoring thresholds) live in `config/`, not scattered through the codebase
- AI is used for language understanding, extraction, and personalization — **not** for deterministic business logic (status changes, follow-up limits, etc.)
- AI never fabricates business information (listings, prices, agent names) — if data is unavailable, the system says so
- Built incrementally, one feature at a time, following the project spec in `AGENTS.md`

## Project Status

🚧 **In active development.** Currently in Phase 1 — project foundation.

## Project Structure
primenest-lead-system/
├── frontend/ # UI code
├── config/ # Business-specific configuration
├── prompts/ # AI prompt templates
├── db/ # Database logic/schema
├── AGENTS.md # Full project specification
└── README.md

## Lead Scoring

| Score | Classification |
|---|---|
| 0–39 | COLD |
| 40–69 | WARM |
| 70–100 | HOT |

Thresholds are configurable in `config/businessConfig.js`.

---

Built by Komal Sharafat as a portfolio project demonstrating AI + automation engineering.