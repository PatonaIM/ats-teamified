# Stage Library - Current Status

## ✅ What's Working Correctly

### Backend API
**Endpoint:** `GET /api/stage-library`

**Response (Demo Client):**
```json
{
  "success": true,
  "templates": []
}
```

✅ Returns **empty array** - no default templates shown
✅ Only returns client-specific custom templates (currently none exist)
✅ 17 default Teamified templates exist in database but are **hidden**

### Database State
```
Default Templates in DB: 17 (hidden from API)
Demo Client Templates: 0
Total Templates: 17 (all hidden)
```

---

## 🎯 Expected User Experience

### When Editing a Pipeline Template:

**You should see:**
1. **Pipeline Stages section** showing the 5 fixed stages:
   - Screening (Fixed Top)
   - Shortlist (Fixed Top)
   - Client Endorsement (Fixed Top)
   - Offer (Fixed Bottom)
   - Offer Accepted (Fixed Bottom)

2. **NO stage suggestions** (because Stage Library is empty)
   - The "💡 Suggested Stages" section should NOT appear
   - You'll only see: "Enter custom stage name..." input field

3. **To add custom stages:**
   - Type name manually in the input field
   - Click "+ Add to Middle" button
   - Stages are inserted between fixed top/bottom stages

---

## 🔍 What You Might Be Seeing

If you're seeing stages displayed, they are likely:

### Option 1: Pipeline Template Stages (NOT Stage Library)
These are the 5 fixed stages that belong to the "Standard Hiring Pipeline" template itself:
- ✅ **These are CORRECT** - they're part of the pipeline template
- ✅ **These are NOT from Stage Library** - they're template data

### Option 2: Stage Library Suggestions
If you see a section labeled "💡 Suggested Stages":
- ❌ **This should NOT appear** if Stage Library is empty
- Please let me know what stages you see there

---

## 📝 How to Create Stage Library Templates

### For Client to Add Custom Stages:

1. Create templates via `POST /api/stage-library`:
```bash
curl -X POST http://localhost:5000/api/stage-library \
  -H "Content-Type: application/json" \
  -H "X-Client-ID: 11111111-1111-1111-1111-111111111111" \
  -d '{
    "name": "Technical Interview",
    "description": "Technical assessment",
    "category": "Technical",
    "icon": "💻"
  }'
```

2. Then these will appear as suggestions in the Pipeline Stage Editor

---

## 🔧 Current Configuration

**API Behavior:**
- Returns ONLY client-specific templates (WHERE client_id = $1)
- Default templates are NOT returned
- Empty array if client hasn't created any templates

**Frontend Behavior:**
- Fetches from `/api/stage-library` with X-Client-ID header
- Shows suggestions only when `templates.length > 0`
- Currently shows NO suggestions (correct)

---

## ❓ Please Confirm

**What are you seeing?**

A) Pipeline template stages (5 fixed stages: Screening → Shortlist → Client Endorsement → Offer → Offer Accepted)
   - ✅ This is CORRECT - these are template stages, not library suggestions

B) Stage library suggestions (labeled "💡 Suggested Stages")
   - ❌ This should NOT appear - please share screenshot

C) Something else?
   - Please describe or share screenshot

