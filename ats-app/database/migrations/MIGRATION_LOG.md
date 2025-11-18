# Database Migration Log

## Migration 008: Stage Library (Updated Behavior)

**Date:** November 18, 2025

**Change:** Modified API behavior to hide default Teamified templates from clients

**Behavior:**
- 17 default stage templates exist in database (seeded during migration)
- Templates marked with `is_default = TRUE` and `client_id = NULL`
- **API now returns ONLY client-specific custom templates** (WHERE client_id = $1)
- Default templates are hidden unless client explicitly creates their own versions

**Rationale:**
- Cleaner UX - clients start with empty stage library
- Clients can create their own custom stages from scratch
- No clutter from pre-built templates they may not want

**API Endpoint:**
- `GET /api/stage-library` - Returns only templates WHERE client_id matches authenticated client
- Returns empty array `[]` if client hasn't created any custom stages yet

**Database State:**
- 17 default templates remain in database (for future use or reference)
- Each client builds their own library independently
