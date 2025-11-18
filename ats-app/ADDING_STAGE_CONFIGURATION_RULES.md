# Adding New Stage Configuration Rules

This guide explains how to add new configuration options to the Stage Configuration Builder.

## 🏗️ Architecture Overview

### Database Storage
```sql
stage_config JSONB DEFAULT '{}'
```
- Configuration stored as **JSONB** (flexible JSON structure)
- No database migrations needed to add new fields
- Unlimited custom fields supported
- Indexed with GIN for fast queries

### Configuration Flow
```
Frontend UI → updateConfig() → config state → onSave() → API → Database (stage_config JSONB)
```

---

## ✅ Step-by-Step: Adding New Configuration Rules

### Step 1: Add UI Fields (Frontend)

**File:** `ats-app/src/components/workflow-builder/StageConfigModal.tsx`

**Where to add:**
- **Category-specific settings:** Inside the appropriate category block (AI Interview, Human Interview, Assessment)
- **General settings:** In the "Automation & Notifications" or "SLA & Visibility" sections
- **New category:** Create a new section with its own heading

**Example: Adding "Requires Manager Approval"**

```tsx
// Add this in the "Automation & Notifications" section (around line 1091)

<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Manager Approval Required
  </label>
  <div className="flex items-center gap-3">
    <input
      type="checkbox"
      checked={config.requiresManagerApproval || false}
      onChange={(e) => updateConfig('requiresManagerApproval', e.target.checked)}
      className="w-4 h-4 text-purple-600 rounded"
    />
    <span className="text-sm text-gray-700 dark:text-gray-300">
      Require hiring manager approval before advancing candidate
    </span>
  </div>
</div>

{/* Conditional field - only show if approval is required */}
{config.requiresManagerApproval && (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
      Approval Timeout (hours)
    </label>
    <input
      type="number"
      min="1"
      max="168"
      value={config.approvalTimeout || 48}
      onChange={(e) => updateConfig('approvalTimeout', parseInt(e.target.value))}
      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
    />
    <p className="text-xs text-gray-500 mt-1">
      Auto-escalate if no approval within this timeframe
    </p>
  </div>
)}
```

---

### Step 2: Add Corresponding Fields to StageConfigPanel.tsx (Optional)

**File:** `ats-app/src/components/workflow-builder/StageConfigPanel.tsx`

If you're using the WorkflowBuilder interface, add the same fields here for consistency.

---

### Step 3: Use the Configuration (Backend)

**File:** `ats-app/server/index.js`

**Example: Enforcing manager approval when moving candidates**

```javascript
// In the candidate stage update endpoint
app.put('/api/candidates/:id/stage', async (req, res) => {
  const { id } = req.params;
  const { newStageId, userId } = req.body;
  
  try {
    // Fetch the target stage configuration
    const stageResult = await query(
      'SELECT stage_config FROM job_pipeline_stages WHERE id = $1',
      [newStageId]
    );
    
    const stageConfig = stageResult.rows[0]?.stage_config || {};
    
    // Check if manager approval is required
    if (stageConfig.requiresManagerApproval) {
      // Create approval request
      await query(`
        INSERT INTO approval_requests (
          candidate_id, 
          stage_id, 
          requested_by, 
          timeout_hours,
          status
        ) VALUES ($1, $2, $3, $4, 'pending')
      `, [id, newStageId, userId, stageConfig.approvalTimeout || 48]);
      
      return res.json({
        success: true,
        message: 'Approval request sent to hiring manager',
        requiresApproval: true
      });
    }
    
    // Normal stage advancement logic
    // ...
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stage' });
  }
});
```

---

## 📋 Examples of New Configuration Rules

### Example 1: Scoring Rubric

**Use Case:** Define custom scoring criteria for interviews

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Scoring Criteria
  </label>
  <div className="space-y-2">
    <div className="flex gap-2">
      <input
        type="text"
        placeholder="Criterion name (e.g., Technical Skills)"
        className="flex-1 px-3 py-2 border rounded-lg"
      />
      <input
        type="number"
        placeholder="Weight %"
        min="1"
        max="100"
        className="w-24 px-3 py-2 border rounded-lg"
      />
    </div>
    {/* Add more criteria dynamically */}
  </div>
</div>
```

**Stored as:**
```json
{
  "scoringCriteria": [
    { "name": "Technical Skills", "weight": 40 },
    { "name": "Communication", "weight": 30 },
    { "name": "Culture Fit", "weight": 30 }
  ]
}
```

---

### Example 2: Time-based Rules

**Use Case:** Block interviews during company holidays

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Interview Blackout Dates
  </label>
  <input
    type="date"
    value={config.blackoutStartDate || ''}
    onChange={(e) => updateConfig('blackoutStartDate', e.target.value)}
    className="w-full px-4 py-2 border rounded-lg"
  />
  <input
    type="date"
    value={config.blackoutEndDate || ''}
    onChange={(e) => updateConfig('blackoutEndDate', e.target.value)}
    className="w-full px-4 py-2 border rounded-lg mt-2"
  />
</div>
```

**Stored as:**
```json
{
  "blackoutStartDate": "2025-12-24",
  "blackoutEndDate": "2025-01-02"
}
```

---

### Example 3: Resource Allocation

**Use Case:** Assign specific team members to interview stages

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Assigned Interviewers
  </label>
  <select
    multiple
    value={config.assignedInterviewers || []}
    onChange={(e) => updateConfig('assignedInterviewers', 
      Array.from(e.target.selectedOptions, option => option.value)
    )}
    className="w-full px-4 py-2 border rounded-lg"
  >
    <option value="user1">John Doe - Senior Engineer</option>
    <option value="user2">Jane Smith - Tech Lead</option>
    <option value="user3">Bob Johnson - Engineering Manager</option>
  </select>
</div>
```

**Stored as:**
```json
{
  "assignedInterviewers": ["user1", "user2"]
}
```

---

### Example 4: Compliance Requirements

**Use Case:** Require document upload (certifications, portfolio)

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Required Documents
  </label>
  <div className="space-y-2">
    {['Resume', 'Cover Letter', 'Portfolio', 'Certifications'].map(doc => (
      <div key={doc} className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={config.requiredDocuments?.includes(doc) || false}
          onChange={(e) => {
            const current = config.requiredDocuments || [];
            const updated = e.target.checked
              ? [...current, doc]
              : current.filter(d => d !== doc);
            updateConfig('requiredDocuments', updated);
          }}
          className="w-4 h-4"
        />
        <label className="text-sm">{doc}</label>
      </div>
    ))}
  </div>
</div>
```

**Stored as:**
```json
{
  "requiredDocuments": ["Resume", "Portfolio", "Certifications"]
}
```

---

### Example 5: External Integration

**Use Case:** Connect to external assessment platforms

```tsx
<div>
  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
    Salesforce Integration
  </label>
  <div className="flex items-center gap-3 mb-3">
    <input
      type="checkbox"
      checked={config.salesforceEnabled || false}
      onChange={(e) => updateConfig('salesforceEnabled', e.target.checked)}
      className="w-4 h-4"
    />
    <span className="text-sm">Sync candidate status to Salesforce</span>
  </div>
  
  {config.salesforceEnabled && (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Salesforce Lead ID"
        value={config.salesforceLeadId || ''}
        onChange={(e) => updateConfig('salesforceLeadId', e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      />
      <select
        value={config.salesforceStageMapping || 'qualified'}
        onChange={(e) => updateConfig('salesforceStageMapping', e.target.value)}
        className="w-full px-4 py-2 border rounded-lg"
      >
        <option value="qualified">Qualified</option>
        <option value="contacted">Contacted</option>
        <option value="nurturing">Nurturing</option>
      </select>
    </div>
  )}
</div>
```

**Stored as:**
```json
{
  "salesforceEnabled": true,
  "salesforceLeadId": "00Q5e00000ABC123",
  "salesforceStageMapping": "qualified"
}
```

---

## 🎯 Best Practices

### 1. Use Descriptive Field Names
```javascript
// ✅ Good
config.requiresManagerApproval
config.approvalTimeoutHours
config.autoAdvanceOnPass

// ❌ Bad
config.approval
config.timeout
config.auto
```

### 2. Provide Default Values
```javascript
// Always provide fallback values
value={config.slaDays || 7}
checked={config.autoAdvance || false}
```

### 3. Add Validation
```javascript
// Add min/max constraints
<input
  type="number"
  min="1"
  max="90"
  value={config.slaDays || 7}
  onChange={(e) => {
    const value = parseInt(e.target.value);
    if (value >= 1 && value <= 90) {
      updateConfig('slaDays', value);
    }
  }}
/>
```

### 4. Use Conditional Rendering
```javascript
// Show fields only when relevant
{config.interviewMode === 'video' && (
  <div>
    {/* Video-specific settings */}
  </div>
)}
```

### 5. Add Help Text
```tsx
<p className="text-xs text-gray-500 mt-1">
  Candidates must achieve this score to pass the assessment
</p>
```

---

## 🔧 Testing New Configuration Rules

### 1. Frontend Testing
1. Add the field to `StageConfigModal.tsx`
2. Rebuild frontend: `npm run build`
3. Restart server
4. Navigate to Pipeline Template editor
5. Click on a stage to configure
6. Verify your new field appears and updates correctly

### 2. Database Testing
```sql
-- Check if configuration is saved
SELECT stage_name, stage_config 
FROM job_pipeline_stages 
WHERE job_id = 'your-job-id';

-- Should return JSON with your new field:
-- {
--   "requiresManagerApproval": true,
--   "approvalTimeout": 48,
--   ...existing fields...
-- }
```

### 3. Backend Testing
```javascript
// In your API endpoint
console.log('Stage Config:', stage.config);
console.log('Manager Approval Required:', stage.config.requiresManagerApproval);
```

---

## 📊 Configuration Field Types

| Field Type | Use Case | Example |
|------------|----------|---------|
| **Boolean (checkbox)** | Yes/No options | `requiresManagerApproval`, `autoAdvance` |
| **Number** | Scores, durations, counts | `slaDays`, `approvalTimeout`, `passingScore` |
| **Text** | Names, descriptions | `notesTemplate`, `assessmentInstructions` |
| **Select (dropdown)** | Predefined options | `interviewMode`, `emailTemplate`, `assessmentType` |
| **Multi-select** | Multiple choices | `assignedInterviewers`, `requiredDocuments` |
| **Date** | Time-based rules | `blackoutStartDate`, `scheduledDate` |
| **Array of objects** | Complex structures | `scoringCriteria`, `customQuestions` |

---

## 🚀 No Database Migrations Needed!

Because configuration is stored as JSONB:
- ✅ Add new fields anytime
- ✅ No schema changes required
- ✅ Backward compatible (old records work fine)
- ✅ Forward compatible (new fields added seamlessly)

**Example:**
```
Old record: { "autoAdvance": true }
New record: { "autoAdvance": true, "requiresManagerApproval": true }
Both work perfectly! ✅
```

---

## 💡 Summary

To add a new configuration rule:

1. **Add UI field** in `StageConfigModal.tsx` (lines 1050-1130)
2. **Use `updateConfig()`** to update state
3. **Save automatically** - JSONB handles storage
4. **Retrieve in backend** - Access via `stage.config.yourFieldName`
5. **No migrations needed** - JSONB is flexible!

That's it! The system is designed to be infinitely extensible. 🎉
