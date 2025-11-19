# Database Migration Log

## Migration 010: Add Job Status Values (paused, filled)

**Date:** November 19, 2025

**Change:** Extended job_status enum to support additional workflow states

**Actions Taken:**
1. Added `paused` value to job_status enum - allows recruiters to temporarily hide jobs
2. Added `filled` value to job_status enum - marks jobs where candidate was hired

**Current job_status Values:**
- `draft` - Job created but not published
- `published` - Job active and visible to candidates
- `paused` - Job temporarily hidden from candidates (can be resumed)
- `filled` - Job position has been filled
- `closed` - Job permanently closed
- `archived` - Job archived for record-keeping

**Rationale:**
- Support pause/resume workflow for active jobs
- Track filled positions separately from closed jobs
- Enable more granular job lifecycle management

**UI Impact:**
- Active jobs show Pause, Mark Filled, and Close buttons
- Paused jobs show Resume, Mark Filled, and Close buttons
- All transitions validated via PUT /api/jobs/:id endpoint

---

## Migration 008: Stage Library (Cleaned - No Default Templates)

**Date:** November 18, 2025

**Change:** Removed all default Teamified templates from Stage Library

**Actions Taken:**
1. Created `stage_library` table via migration 008
2. Seeded 17 default stage templates during migration
3. **DELETED all 17 default templates** (November 18, 2025) to provide clean slate for clients
4. Added cache-control headers to Stage Library API to prevent browser caching

**Current State:**
- Stage Library table is **completely empty** (0 templates)
- Clients must create their own custom stage templates from scratch
- No pre-built or default templates exist in the system

**Rationale:**
- Cleaner UX - clients start with empty stage library
- Clients create only the stages they need
- No clutter from pre-built templates

**API Endpoint:**
- `GET /api/stage-library` - Returns only client-specific custom templates (WHERE client_id = $1)
- Returns empty array `[]` for all clients (no default templates exist)
- Cache-Control headers prevent browser caching of old data

**Database State:**
- 0 default templates in database
- Each client builds their own library from scratch
