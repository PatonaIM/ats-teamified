# Multi-Employment ATS - UI Specifications

## Brand Identity
- **Primary Color**: Purple `#A16AE8`
- **Secondary Color**: Blue `#8096FD`
- **Framework**: React + Vite + Tailwind CSS + shadcn/ui
- **Design System**: Modern, clean, professional with gradient accents

---

## 1. Landing Page (Public - Unauthenticated)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│  [Logo]                    [Features] [Pricing] [Sign In]   │ ← Header
├─────────────────────────────────────────────────────────────┤
│                                                               │
│           Hero Section (Gradient Purple → Blue)              │
│                                                               │
│     "Intelligent Multi-Employment Hiring Platform"           │
│      Streamline contract, part-time, full-time & EOR         │
│                                                               │
│         [Get Started] [Watch Demo]                           │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              Key Features Section                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │ AI Job   │  │ LinkedIn │  │ 6-Stage  │  │ Analytics│    │
│  │ Creation │  │ Sync     │  │ Pipeline │  │Dashboard │    │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Employment Types Showcase                        │
│  [Contract] [Part-Time] [Full-Time] [EOR]                   │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│              Testimonials / Social Proof                      │
├─────────────────────────────────────────────────────────────┤
│  Footer: [About] [Contact] [Privacy] [Terms]                │
└─────────────────────────────────────────────────────────────┘
```

### Components (shadcn/ui)
- `Button` (variant: default with purple gradient)
- `Card` for feature showcases
- `Badge` for employment type tags
- Gradient backgrounds using Tailwind CSS

### Color Usage
- Hero gradient: `from-purple-500 to-blue-500` (`#A16AE8` → `#8096FD`)
- CTA buttons: Purple primary with hover effects
- Feature cards: White with purple accent borders

---

## 2. Side Menu (Navigation - Authenticated Users)

### Structure by Role

#### A. Admin / Recruiter Manager
```
┌─────────────────────────────┐
│  [Logo] Multi-ATS           │
├─────────────────────────────┤
│  👤 John Doe                │
│  Recruiter Manager          │
├─────────────────────────────┤
│                             │
│  📊 Dashboard               │ ← Active (Purple highlight)
│  💼 Jobs                    │
│     ├─ All Jobs             │
│     ├─ Create Job           │
│     └─ Pending Approval     │
│  👥 Candidates              │
│     ├─ Pipeline View        │
│     ├─ All Candidates       │
│     └─ Archived             │
│  🤖 AI Tools                │
│     ├─ Job Descriptions     │
│     ├─ Interview Questions  │
│     └─ Sentiment Analysis   │
│  📈 Analytics               │
│     ├─ Hiring Funnel        │
│     ├─ Time-to-Hire         │
│     └─ Source Effectiveness │
│  🔔 Notifications (3)       │
│  ⚙️ Settings                │
│     ├─ Pipeline Config      │
│     ├─ Team Management      │
│     └─ Integrations         │
│                             │
├─────────────────────────────┤
│  🚪 Sign Out                │
└─────────────────────────────┘
```

#### B. Recruiter (Individual Contributor)
```
┌─────────────────────────────┐
│  [Logo] Multi-ATS           │
├─────────────────────────────┤
│  👤 Jane Smith              │
│  Recruiter                  │
├─────────────────────────────┤
│  📊 Dashboard               │
│  💼 My Jobs                 │
│  👥 My Candidates           │
│  🤖 AI Tools                │
│     ├─ Job Descriptions     │
│     └─ Interview Questions  │
│  🔔 Notifications (5)       │
│  ⚙️ Settings                │
└─────────────────────────────┘
```

#### C. Client
```
┌─────────────────────────────┐
│  [Logo] Multi-ATS           │
├─────────────────────────────┤
│  👤 Client Name             │
│  Client                     │
├─────────────────────────────┤
│  📊 Dashboard               │
│  💼 Job Requests            │
│     ├─ Active Requests      │
│     └─ Create Request       │
│  👥 Candidates              │
│     ├─ For Review           │
│     ├─ Client Endorsed      │
│     └─ Interviews Scheduled │
│  🔔 Notifications (2)       │
│  ⚙️ Settings                │
└─────────────────────────────┘
```

### Side Menu Specifications
- **Width**: 260px (expanded), 64px (collapsed)
- **Background**: White with subtle shadow
- **Active Item**: Purple background (`bg-purple-100`), Purple text (`text-purple-600`)
- **Hover State**: Light purple background (`bg-purple-50`)
- **Icons**: Lucide React icons
- **Collapse Toggle**: Hamburger icon at top
- **Components**: shadcn/ui `Sheet` or custom sidebar with `Collapsible`

---

## 3. Dashboard (Main Content Area)

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard                                    🔍 Search   🔔 (3)  👤    │ ← Top Bar
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Welcome back, John! 👋                           📅 Nov 13, 2025      │
│                                                                          │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│  │  Active Jobs     │ │  Candidates      │ │  Offers Pending  │       │
│  │                  │ │                  │ │                  │       │
│  │      24          │ │       156        │ │        8         │       │
│  │  ↗ +3 this week  │ │  ↗ +12 this week │ │  ⚠️ 2 expiring   │       │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Quick Actions                                                          │
│  [+ Create Job] [📤 Import Candidates] [🤖 AI Job Description]         │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Recent Activity                              📊 Hiring Funnel         │
│  ┌───────────────────────────────┐           ┌──────────────────────┐ │
│  │ • Contract Developer position │           │                      │ │
│  │   moved to Client Interview   │           │  Screening    45     │ │
│  │   2 mins ago                  │           │  Shortlist    28     │ │
│  │                               │           │  Client End.  18     │ │
│  │ • 3 new candidates added to   │           │  Interview    12     │ │
│  │   Full-Time Marketing Manager │           │  Offer         5     │ │
│  │   15 mins ago                 │           │  Accepted      3     │ │
│  │                               │           │                      │ │
│  │ • AI generated job description│           └──────────────────────┘ │
│  │   for EOR Sales Rep           │                                    │
│  │   1 hour ago                  │                                    │
│  └───────────────────────────────┘                                    │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Jobs Requiring Attention                                               │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Contract: Senior DevOps Engineer                    [Part-Time] │  │
│  │ 5 candidates in Client Endorsement stage             View →     │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ Full-Time: Product Manager                          [Full-Time] │  │
│  │ Budget approval pending - 2 days                     Review →    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │ EOR: UX Designer (Remote - APAC)                         [EOR]  │  │
│  │ Interview scheduled tomorrow 10:00 AM                 Prep →     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Components

#### A. Stats Cards (KPI Summary)
```tsx
<Card>
  <CardHeader>
    <CardTitle>Active Jobs</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-purple-600">24</div>
    <p className="text-sm text-green-600">↗ +3 this week</p>
  </CardContent>
</Card>
```
- **Components**: shadcn/ui `Card`, `CardHeader`, `CardContent`
- **Colors**: Purple for primary metrics, Green/Red for trends

#### B. Quick Actions Bar
- **Buttons**: Primary (Purple), Secondary (Blue), Ghost
- **Icons**: Plus, Upload, Sparkles (AI)
- **Layout**: Horizontal flex with gap

#### C. Recent Activity Feed
- **Component**: shadcn/ui `Card` with scrollable content
- **Items**: Timeline-style with icons
- **Height**: Max 400px with overflow scroll
- **Updates**: Real-time via WebSocket

#### D. Hiring Funnel Chart
- **Library**: Recharts or Chart.js
- **Type**: Horizontal funnel or vertical bar chart
- **Colors**: Purple gradient for bars
- **Interactive**: Click to filter candidates

#### E. Jobs Table/Cards
- **Component**: shadcn/ui `Table` or `Card` grid
- **Badges**: Employment type with color coding
  - Contract: Purple (`bg-purple-100 text-purple-700`)
  - Part-Time: Blue (`bg-blue-100 text-blue-700`)
  - Full-Time: Green (`bg-green-100 text-green-700`)
  - EOR: Orange (`bg-orange-100 text-orange-700`)
- **Actions**: View, Edit, Archive buttons

---

## 4. Top Navigation Bar

```
┌─────────────────────────────────────────────────────────────────────┐
│  Dashboard                  🔍 [Search candidates, jobs...]          │
│                                                                       │
│                             🔔 (3)    👤 John Doe    ⚙️   🚪        │
└─────────────────────────────────────────────────────────────────────┘
```

### Components
- **Page Title**: H1 with breadcrumb navigation
- **Search**: shadcn/ui `Input` with search icon (Command+K shortcut)
- **Notifications**: Badge with count, Dropdown menu
- **User Menu**: Avatar dropdown with:
  - Profile
  - Settings
  - Theme toggle (light/dark)
  - Sign out

---

## 5. Responsive Behavior

### Desktop (≥1024px)
- Side menu: 260px fixed
- Main content: Flexible width
- Dashboard: 3-column grid for stats

### Tablet (768px - 1023px)
- Side menu: Collapsible (starts collapsed)
- Main content: Full width
- Dashboard: 2-column grid for stats

### Mobile (<768px)
- Side menu: Drawer/Sheet overlay
- Top bar: Hamburger menu
- Dashboard: Single column layout
- Stats cards: Full width stacked

---

## 6. Color Palette

### Primary Colors
```css
--purple-primary: #A16AE8;
--blue-secondary: #8096FD;
```

### Employment Type Colors
```css
--contract: #A16AE8;     /* Purple */
--part-time: #8096FD;    /* Blue */
--full-time: #10B981;    /* Green */
--eor: #F59E0B;          /* Orange */
```

### Status Colors
```css
--success: #10B981;      /* Green */
--warning: #F59E0B;      /* Amber */
--error: #EF4444;        /* Red */
--info: #3B82F6;         /* Blue */
```

### Tailwind CSS Configuration
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#A16AE8',
        secondary: '#8096FD',
        contract: '#A16AE8',
        'part-time': '#8096FD',
        'full-time': '#10B981',
        eor: '#F59E0B',
      },
    },
  },
}
```

---

## 7. Component Library (shadcn/ui)

### Required Components
- ✅ `Button` - Primary actions, CTAs
- ✅ `Card` - Content containers, stats
- ✅ `Badge` - Employment types, status tags
- ✅ `Table` - Jobs list, candidates list
- ✅ `Input` - Search, forms
- ✅ `Select` - Dropdowns, filters
- ✅ `Sheet` - Side menu mobile
- ✅ `Dialog` - Modals, confirmations
- ✅ `Dropdown Menu` - User menu, actions
- ✅ `Avatar` - User profile pictures
- ✅ `Tabs` - Dashboard sections
- ✅ `Progress` - Pipeline stages
- ✅ `Alert` - Notifications, warnings
- ✅ `Separator` - Visual dividers
- ✅ `Collapsible` - Expandable menu items

---

## 8. Key User Flows

### A. Recruiter Dashboard Flow
1. **Login** → Custom SSO redirect → OAuth callback
2. **Dashboard** → See active jobs, candidate stats
3. **Create Job** → AI-assisted job description → Review → Post to LinkedIn
4. **Manage Candidates** → Pipeline view → Move stages → Accept/Reject decisions

### B. Client Dashboard Flow
1. **Login** → Custom SSO redirect
2. **Dashboard** → See job requests, candidates for review
3. **Review Candidates** → Endorse or reject → Schedule interviews
4. **Track Progress** → See hiring funnel for their jobs

---

## 9. Accessibility (WCAG 2.1 AA)

- **Contrast Ratio**: Minimum 4.5:1 for text
- **Keyboard Navigation**: Full support with focus indicators
- **Screen Readers**: ARIA labels on all interactive elements
- **Focus Management**: Logical tab order
- **Color Independence**: Don't rely solely on color for information

---

## 10. Design System Resources

### Figma Design Kit
- Component library: shadcn/ui components
- Color system: Purple/Blue theme
- Typography: Inter font family
- Icons: Lucide React

### Development Setup
```bash
# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer

# Install shadcn/ui
npx shadcn-ui@latest init

# Add components
npx shadcn-ui@latest add button card badge table
```

---

---

## 11. Jobs List Page (Detailed Wireframe)

### Layout Structure
```
┌──────────────────────────────────────────────────────────────────────────┐
│  💼 Jobs                           🔍 [Search jobs...]  [+ Create Job]   │ ← Header
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Filters:                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐   │
│  │ All Types ▼  │ │ All Status ▼ │ │ All Clients▼ │ │ Date Range ▼│   │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘   │
│                                                                           │
│  Active Filters: [Contract ×] [Posted this week ×]    Clear All         │
│                                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  Showing 24 jobs                          [List View] [Grid View]        │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Senior Full-Stack Developer                      [Full-Time] 🟢    │ │
│  │ Acme Corp · San Francisco, CA (Remote OK)                          │ │
│  │                                                                      │ │
│  │ Posted: 2 days ago · Candidates: 12 · Stage: Shortlist (5)         │ │
│  │ Budget: $120k-$150k · Recruiter: John Doe                          │ │
│  │                                                                      │ │
│  │ Pipeline Progress:  ████████░░░░░░░░░░  (8/12 candidates active)   │ │
│  │                                                                      │ │
│  │ [View Details] [Edit] [View Candidates] [LinkedIn Status: ✓ Synced]│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ DevOps Engineer (Contract - 6 months)            [Contract] 🟣     │ │
│  │ TechStart Inc · Austin, TX (Remote)                                │ │
│  │                                                                      │ │
│  │ Posted: 1 week ago · Candidates: 8 · Stage: Client Interview (3)   │ │
│  │ Budget: $95/hr · Recruiter: Jane Smith                             │ │
│  │                                                                      │ │
│  │ Pipeline Progress:  ██████████████░░░░  (6/8 candidates active)    │ │
│  │                                                                      │ │
│  │ ⚠️ Action Required: 3 candidates awaiting client endorsement        │ │
│  │                                                                      │ │
│  │ [View Details] [Edit] [View Candidates] [LinkedIn Status: ✓ Synced]│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ UX Designer (Part-Time - 20hrs/week)              [Part-Time] 🔵   │ │
│  │ Design Studio · New York, NY (Hybrid)                              │ │
│  │                                                                      │ │
│  │ Posted: 3 days ago · Candidates: 15 · Stage: Screening (12)        │ │
│  │ Budget: $50-$65/hr · Recruiter: Mike Johnson                       │ │
│  │                                                                      │ │
│  │ Pipeline Progress:  ████░░░░░░░░░░░░░░  (3/15 candidates active)   │ │
│  │                                                                      │ │
│  │ [View Details] [Edit] [View Candidates] [LinkedIn Status: Pending] │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Sales Manager (EOR - APAC Region)                      [EOR] 🟠    │ │
│  │ Global Solutions · Singapore (Remote - APAC TZ)                    │ │
│  │                                                                      │ │
│  │ Posted: 5 days ago · Candidates: 6 · Stage: Offer (1)              │ │
│  │ Budget: Confidential · Recruiter: Sarah Lee                        │ │
│  │                                                                      │ │
│  │ Pipeline Progress:  ████████████████░░  (5/6 candidates active)    │ │
│  │                                                                      │ │
│  │ 🎉 Success: 1 offer pending acceptance                              │ │
│  │                                                                      │ │
│  │ [View Details] [Edit] [View Candidates] [LinkedIn Status: ✓ Synced]│ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  [Load More Jobs]                                   Showing 1-4 of 24   │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### Job Card Components

#### Status Indicators
- **Active** 🟢 - Job is open and accepting candidates
- **Paused** 🟡 - Job temporarily on hold
- **Filled** ✅ - Job successfully filled
- **Closed** 🔴 - Job closed without hire

#### Employment Type Badges
```tsx
<Badge variant="outline" className="border-purple-500 text-purple-700">
  Contract
</Badge>
<Badge variant="outline" className="border-blue-500 text-blue-700">
  Part-Time
</Badge>
<Badge variant="outline" className="border-green-500 text-green-700">
  Full-Time
</Badge>
<Badge variant="outline" className="border-orange-500 text-orange-700">
  EOR
</Badge>
```

#### Action Alerts
- ⚠️ **Warning**: Requires attention (yellow background)
- 🎉 **Success**: Positive milestone (green background)
- 🔔 **Info**: General notification (blue background)

### Grid View Alternative
```
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Full-Stack Dev  │ │ DevOps Engineer │ │ UX Designer     │
│ [Full-Time] 🟢  │ │ [Contract] 🟣   │ │ [Part-Time] 🔵  │
│                 │ │                 │ │                 │
│ 12 Candidates   │ │ 8 Candidates    │ │ 15 Candidates   │
│ Shortlist (5)   │ │ Interview (3)   │ │ Screening (12)  │
│                 │ │                 │ │                 │
│ [View Details]  │ │ [View Details]  │ │ [View Details]  │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 12. Candidate Pipeline Page (Kanban View)

### Layout Structure
```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  👥 Candidates - Senior Full-Stack Developer          🔍 [Search candidates...]   │
│                                                                                   │
│  [Pipeline View] [List View] [Analytics]                     Export CSV ↓        │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │ Screening   │ │ Shortlist   │ │   Client    │ │   Client    │ │   Offer   │ │
│  │             │ │             │ │ Endorsement │ │  Interview  │ │           │ │
│  │     (7)     │ │     (5)     │ │     (3)     │ │     (2)     │ │    (1)    │ │
│  ├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤ ├───────────┤ │
│  │             │ │             │ │             │ │             │ │           │ │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │┌─────────┐│ │
│  │ │ Sarah J.│ │ │ │ Mike K. │ │ │ │ Emily R.│ │ │ │ David L.│ │ ││ Lisa M. ││ │
│  │ │ ⭐⭐⭐⭐⭐  │ │ │ │ ⭐⭐⭐⭐   │ │ │ │ ⭐⭐⭐⭐⭐  │ │ │ │ ⭐⭐⭐⭐⭐  │ │ ││ ⭐⭐⭐⭐⭐ ││ │
│  │ │         │ │ │ │         │ │ │ │         │ │ │ │         │ │ ││         ││ │
│  │ │ 5 yrs   │ │ │ │ 8 yrs   │ │ │ │ 6 yrs   │ │ │ │ 10 yrs  │ │ ││ 7 yrs   ││ │
│  │ │ React+  │ │ │ │ Full-   │ │ │ │ React+  │ │ │ │ React+  │ │ ││ Senior  ││ │
│  │ │ Node.js │ │ │ │ Stack   │ │ │ │ Node.js │ │ │ │ Node.js │ │ ││ Full-   ││ │
│  │ │         │ │ │ │         │ │ │ │         │ │ │ │         │ │ ││ Stack   ││ │
│  │ │ 📄 💬 ⚡│ │ │ │ 📄 💬 ⚡│ │ │ │ 📄 💬 ⚡│ │ │ │ 📄 💬 ⚡│ │ ││ 📄 💬 ⚡││ │
│  │ │ [View] │ │ │ │ [View] │ │ │ │ [View] │ │ │ │ [View] │ │ ││ [View] ││ │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │└─────────┘│ │
│  │             │ │             │ │             │ │             │ │           │ │
│  │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │ ┌─────────┐ │ │           │ │
│  │ │ John D. │ │ │ │ Anna P. │ │ │ │ Tom W.  │ │ │ │ Nina S. │ │ │           │ │
│  │ │ ⭐⭐⭐     │ │ │ │ ⭐⭐⭐⭐⭐  │ │ │ │ ⭐⭐⭐⭐   │ │ │ │ ⭐⭐⭐⭐⭐  │ │ │           │ │
│  │ │ ...     │ │ │ │ ...     │ │ │ │ ...     │ │ │ │ ...     │ │ │           │ │
│  │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │ └─────────┘ │ │           │ │
│  │             │ │             │ │             │ │             │ │           │ │
│  │ [+5 more]  │ │ [+3 more]  │ │ [+1 more]  │ │             │ │           │ │
│  │             │ │             │ │             │ │             │ │           │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
│                                                                                   │
│  ← Offer Accepted (1) →                                                          │
│  ┌────────────────────────────────────────────────────────────────┐              │
│  │ ✅ Alex Chen - Offer Accepted! Starting Dec 1, 2025           │              │
│  │    🎉 Congratulations! Move to onboarding?                     │              │
│  │    [Move to Onboarding] [View Details]                        │              │
│  └────────────────────────────────────────────────────────────────┘              │
│                                                                                   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### External Portal Integration Points

Several pipeline stages involve back-and-forth communication with the **Candidate Portal**:

#### Stages with External Portal Interaction

**1. Assessment Stage** (After Screening)
- **ATS → Portal**: Recruiter assigns assessment in ATS
- **Portal Action**: Candidate completes assessment in their portal
- **Portal → ATS**: Results automatically sync back to ATS
- **ATS Display**: Assessment scores, completion status, time taken

**2. Interview Scheduling** (Client Interview stage)
- **ATS → Portal**: Interview invitation sent via Team Connect integration
- **Portal Action**: Candidate accepts/reschedules interview
- **Portal → ATS**: Confirmation syncs back with calendar updates
- **ATS Display**: Interview status, scheduled time, meeting link

**3. Document Requests**
- **ATS → Portal**: Recruiter requests additional documents
- **Portal Action**: Candidate uploads documents
- **Portal → ATS**: Documents sync to ATS blob storage
- **ATS Display**: Document status, upload timestamp

**4. Offer Acceptance**
- **ATS → Portal**: Offer letter sent to candidate portal
- **Portal Action**: Candidate reviews and accepts/rejects
- **Portal → ATS**: Decision syncs with digital signature
- **ATS Display**: Offer status, signature timestamp

### Candidate Card Components (with Portal Status)

#### Enhanced Card Structure with External Portal Indicators
```tsx
<Card className="cursor-move hover:shadow-lg transition-shadow" draggable>
  <CardHeader className="p-3">
    <div className="flex items-center justify-between">
      <Avatar>
        <AvatarImage src="/avatars/sarah.jpg" />
        <AvatarFallback>SJ</AvatarFallback>
      </Avatar>
      <Badge variant="outline">New</Badge>
    </div>
    <CardTitle className="text-sm mt-2">Sarah Johnson</CardTitle>
  </CardHeader>
  <CardContent className="p-3 pt-0">
    <div className="flex items-center gap-1 text-yellow-500 text-xs mb-2">
      ⭐⭐⭐⭐⭐ <span className="text-gray-600">(5.0)</span>
    </div>
    
    {/* External Portal Status Indicator */}
    <div className="mb-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
      🔄 <span className="text-blue-700 dark:text-blue-300">
        Assessment pending in candidate portal
      </span>
    </div>
    
    <div className="text-xs text-gray-600 space-y-1">
      <div>📍 San Francisco, CA</div>
      <div>💼 5 years experience</div>
      <div>💻 React, Node.js, TypeScript</div>
      <div>📧 Responded 2h ago</div>
    </div>
    <div className="flex gap-2 mt-3">
      <Button size="icon" variant="ghost" className="h-6 w-6">
        📄 {/* Resume */}
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6">
        💬 {/* Messages */}
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6">
        ⚡ {/* Quick Actions */}
      </Button>
    </div>
    <Button size="sm" className="w-full mt-2" variant="outline">
      View Profile
    </Button>
  </CardContent>
</Card>
```

#### Portal Status Indicators (displayed on candidate cards)

**Pending Actions:**
- 🔄 **Assessment Pending**: Blue background - "Assessment pending in candidate portal"
- 🔄 **Interview Scheduling**: Blue background - "Awaiting interview confirmation"
- 🔄 **Document Request**: Blue background - "Additional documents requested"
- 🔄 **Offer Pending**: Blue background - "Offer sent, awaiting response"

**Completed Actions:**
- ✅ **Assessment Completed**: Green background - "Assessment completed - Score: 85%"
- ✅ **Interview Confirmed**: Green background - "Interview scheduled for Nov 15, 10:00 AM"
- ✅ **Documents Uploaded**: Green background - "3 documents received"
- ✅ **Offer Accepted**: Green background - "Offer accepted - Start date: Dec 1"

**Overdue/Failed:**
- ⚠️ **Assessment Overdue**: Yellow background - "Assessment due 2 days ago"
- ❌ **Interview Declined**: Red background - "Candidate declined interview"
- ❌ **Offer Rejected**: Red background - "Offer declined by candidate"

#### Engagement Indicators
- 🟢 **High Engagement**: Responded < 2 hours
- 🟡 **Medium Engagement**: Responded 2-24 hours
- 🔴 **Low Engagement**: No response > 24 hours
- ⚠️ **At Risk**: No activity > 3 days

#### Drag & Drop Behavior
- **Visual Feedback**: Card lifts on drag, shadow increases
- **Drop Zones**: Columns highlight in purple when hovering
- **Confirmation**: Modal appears for stage change with decision logging
- **Auto-save**: Changes save immediately with undo option

---

## 12a. Candidate Profile Page (with External Portal Data)

### Layout Structure
```
┌──────────────────────────────────────────────────────────────────────────┐
│  ← Back to Pipeline    Sarah Johnson                    [Edit] [Message] │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ 👤 Sarah Johnson                                  [Full-Time] 🟢    │ │
│  │                                                                      │ │
│  │ 📧 sarah.j@email.com    📱 (555) 123-4567    📍 San Francisco, CA  │ │
│  │ 💼 5 years experience   🎓 BS Computer Science                      │ │
│  │                                                                      │ │
│  │ Current Stage: Shortlist                       Engagement: 🟢 95%   │ │
│  │ Applied: Nov 8, 2025                          Recruiter: John Doe   │ │
│  │                                                                      │ │
│  │ [Move to Next Stage] [Schedule Interview] [Request Documents]      │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [Overview] [Assessments] [Interviews] [Documents] [Activity]           │
│                                                                           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  📝 Assessments (from External Portal)                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Technical Assessment - JavaScript                                │ │
│  │    Score: 85/100                                Status: Completed    │ │
│  │    Completed: Nov 9, 2025 at 2:30 PM           Time: 45 mins        │ │
│  │                                                                      │ │
│  │    Performance Breakdown:                                           │ │
│  │    • Code Quality: ████████████████░░ 90%                           │ │
│  │    • Problem Solving: ████████████░░░░ 80%                          │ │
│  │    • Best Practices: ████████████████░ 85%                          │ │
│  │                                                                      │ │
│  │    🔗 Synced from Candidate Portal                                  │ │
│  │    [View Full Report] [Download Results]                            │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ 🔄 System Design Assessment                                         │ │
│  │    Status: Pending                             Sent: Nov 10, 2025   │ │
│  │    Due: Nov 17, 2025                          Reminder: Sent Nov 13 │ │
│  │                                                                      │ │
│  │    ⚠️ Assessment assigned via candidate portal - awaiting completion│ │
│  │    [Send Reminder] [View in Portal ↗]                               │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  📅 Interviews (Team Connect Integration)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Phone Screening                                                   │ │
│  │    Date: Nov 9, 2025 at 10:00 AM               Duration: 30 mins    │ │
│  │    Interviewer: John Doe                       Rating: ⭐⭐⭐⭐⭐      │ │
│  │    Status: Completed                                                │ │
│  │                                                                      │ │
│  │    Notes: "Excellent technical background, strong communication..."│ │
│  │    [View Full Notes] [Download Recording]                           │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ 🔄 Technical Interview (Virtual)                                    │ │
│  │    Date: Nov 15, 2025 at 2:00 PM               Duration: 60 mins    │ │
│  │    Interviewers: Jane Smith, Mike Johnson                           │ │
│  │    Status: Scheduled ✓                         Meeting: Zoom Link   │ │
│  │                                                                      │ │
│  │    🔗 Scheduled via Team Connect - Synced to candidate portal       │ │
│  │    Candidate Confirmed: ✓ Nov 13, 2025 at 9:15 AM                  │ │
│  │                                                                      │ │
│  │    [Join Meeting] [Reschedule] [Send Prep Materials]                │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  📄 Documents (from Candidate Portal)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ ✅ Resume - sarah_johnson_resume.pdf                                │ │
│  │    Uploaded: Nov 8, 2025                       Size: 245 KB         │ │
│  │    Source: LinkedIn Application                                     │ │
│  │    [View] [Download]                                                │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ ✅ Portfolio - portfolio_website.pdf                                │ │
│  │    Uploaded: Nov 9, 2025                       Size: 1.2 MB         │ │
│  │    Source: Candidate Portal                                         │ │
│  │    🔗 Uploaded via portal document request                          │ │
│  │    [View] [Download]                                                │ │
│  ├─────────────────────────────────────────────────────────────────────┤ │
│  │ 🔄 References - Requested                                           │ │
│  │    Requested: Nov 13, 2025                     Status: Pending      │ │
│  │    Due: Nov 20, 2025                                                │ │
│  │                                                                      │ │
│  │    🔗 Request sent to candidate portal - awaiting upload            │ │
│  │    [Send Reminder] [View Request]                                   │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  🎯 Portal Activity Timeline                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Nov 13, 9:15 AM - 🔔 Interview confirmed in portal                  │ │
│  │ Nov 10, 3:00 PM - 🔄 System design assessment assigned              │ │
│  │ Nov 9, 2:30 PM  - ✅ Technical assessment completed (Score: 85%)    │ │
│  │ Nov 9, 9:00 AM  - 📄 Portfolio uploaded via portal                  │ │
│  │ Nov 8, 11:30 AM - 🔔 Welcome email sent to portal                   │ │
│  │ Nov 8, 9:00 AM  - 📧 Application received from LinkedIn             │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

### External Portal Action Buttons

**In Recruiter's ATS View:**
```tsx
{/* Send Assessment */}
<Button onClick={sendAssessment}>
  <FileText className="mr-2" />
  Assign Assessment
</Button>
// Opens modal to select assessment from library
// Automatically sends to candidate portal
// Creates pending task in portal

{/* Schedule Interview */}
<Button onClick={scheduleInterview}>
  <Calendar className="mr-2" />
  Schedule Interview
</Button>
// Opens Team Connect integration
// Sends calendar invite to candidate portal
// Candidate can accept/reschedule in their portal

{/* Request Documents */}
<Button onClick={requestDocuments}>
  <Upload className="mr-2" />
  Request Documents
</Button>
// Opens document request form
// Sends notification to candidate portal
// Candidate uploads in their portal, syncs to ATS

{/* Send Offer */}
<Button onClick={sendOffer}>
  <FileSignature className="mr-2" />
  Send Offer
</Button>
// Generates offer letter
// Sends to candidate portal for e-signature
// Acceptance syncs back to ATS
```

### Real-time Sync Indicators

```tsx
{/* Syncing indicator */}
<div className="flex items-center gap-2 text-xs text-blue-600">
  <Loader2 className="h-3 w-3 animate-spin" />
  Syncing with candidate portal...
</div>

{/* Last synced */}
<div className="text-xs text-gray-500">
  Last synced: 2 minutes ago
  <Button variant="ghost" size="sm" onClick={manualSync}>
    <RefreshCw className="h-3 w-3" />
  </Button>
</div>

{/* Sync error */}
<div className="flex items-center gap-2 text-xs text-red-600">
  <AlertCircle className="h-3 w-3" />
  Sync failed - Retry?
  <Button variant="ghost" size="sm" onClick={retrySync}>
    Retry
  </Button>
</div>
```

---

## 13. Candidate Movement Flow (Detailed)

### Movement Modal/Dialog
```
┌─────────────────────────────────────────────────────────────┐
│  Move Candidate: Sarah Johnson                          ×   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Current Stage: Screening                                   │
│  Move to: [Client Endorsement ▼]                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Candidate Profile Summary                              │ │
│  │                                                         │ │
│  │ 👤 Sarah Johnson                                       │ │
│  │ 📧 sarah.j@email.com · 📱 (555) 123-4567              │ │
│  │ 📍 San Francisco, CA                                   │ │
│  │ ⭐ Rating: 5.0 (Based on screening)                    │ │
│  │                                                         │ │
│  │ Skills Match: ████████████░░░░ 80%                     │ │
│  │ Engagement Score: ████████████████ 95%                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Decision Type:                                             │
│  ○ Accept - Move to next stage                             │
│  ○ Reject - Remove from pipeline                           │
│                                                              │
│  Reason / Notes: (Required)                                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Strong technical background with 5 years React         │ │
│  │ experience. Excellent communication during screening.  │ │
│  │ Recommended for client review.                         │ │
│  │                                                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  📎 Attach Files (Optional)                                 │
│  [Browse Files]                                             │
│                                                              │
│  Notify:                                                    │
│  ☑ Candidate (Email notification)                          │
│  ☑ Client (For endorsement review)                         │
│  ☑ Assigned Recruiter                                      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ ⚡ AI Suggestion:                                       │ │
│  │ Based on sentiment analysis, this candidate shows high │ │
│  │ engagement (95%) and quick response time. Recommend    │ │
│  │ fast-tracking to client endorsement.                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│                      [Cancel]  [Move Candidate]             │
└─────────────────────────────────────────────────────────────┘
```

### Movement History Timeline
```
┌─────────────────────────────────────────────────────────────┐
│  Candidate Movement History: Sarah Johnson                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ ○──────────────────────────────────────────────────────○││
│  │ │                                                        │││
│  │ ↓ Applied                     ↓ Screening                │││
│  │   Nov 8, 2025                   Nov 9, 2025              │││
│  │   Source: LinkedIn              By: John Doe             │││
│  │                                 Decision: Accept ✓       │││
│  │                                                           ││
│  │                                 ↓ Client Endorsement     │││
│  │                                   Nov 13, 2025           │││
│  │                                   By: Jane Smith         │││
│  │                                   Status: Pending        │││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Activity Details:                                          │
│  ─────────────────────────────────────────────────────      │
│  📧 Nov 13, 10:30 AM - Moved to Client Endorsement          │
│     By: John Doe                                            │
│     Note: "Strong technical background with 5 years..."     │
│     Notified: Candidate, Client, Recruiter                  │
│                                                              │
│  💬 Nov 9, 2:15 PM - Screening Interview Completed          │
│     By: John Doe                                            │
│     Rating: 5/5 stars                                       │
│     Note: "Excellent communication skills..."               │
│                                                              │
│  📄 Nov 8, 9:00 AM - Application Received                   │
│     Source: LinkedIn Jobs                                   │
│     Resume: sarah_johnson_resume.pdf                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Bulk Movement
```
┌─────────────────────────────────────────────────────────────┐
│  Bulk Move Candidates                                    ×   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Selected Candidates: 3                                     │
│                                                              │
│  ☑ Sarah Johnson         (Screening)                        │
│  ☑ Mike Kumar            (Screening)                        │
│  ☑ Anna Peterson         (Screening)                        │
│                                                              │
│  Move all to: [Shortlist ▼]                                │
│                                                              │
│  Decision: ○ Accept  ○ Reject                               │
│                                                              │
│  Bulk Note (Applied to all):                                │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ All candidates passed initial screening criteria and   │ │
│  │ meet minimum qualifications. Moving to shortlist for   │ │
│  │ detailed review.                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  Notify all candidates: ☑                                   │
│                                                              │
│                      [Cancel]  [Move 3 Candidates]          │
└─────────────────────────────────────────────────────────────┘
```

### Auto-Movement Rules (Phase 2)
```
┌─────────────────────────────────────────────────────────────┐
│  Pipeline Automation Rules                              ×    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Rule: Auto-reject low engagement candidates                │
│  Status: ○ Active  ● Inactive                               │
│                                                              │
│  Trigger:                                                   │
│  When: Engagement score < 30% for 7 days                    │
│  Stage: Any stage before Client Interview                   │
│                                                              │
│  Action:                                                    │
│  ✓ Move to: Rejected                                        │
│  ✓ Send notification to candidate                          │
│  ✓ Log reason: "Low engagement - no response in 7 days"    │
│  ✓ Notify recruiter                                         │
│                                                              │
│  [Save Rule]  [Test Rule]  [Delete]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 14. Dark Mode Specifications

### Color Palette

#### Light Mode (Default)
```css
:root {
  /* Brand Colors */
  --primary: #A16AE8;              /* Purple */
  --secondary: #8096FD;            /* Blue */
  
  /* Background */
  --background: #FFFFFF;           /* White */
  --background-secondary: #F9FAFB; /* Gray 50 */
  --background-tertiary: #F3F4F6;  /* Gray 100 */
  
  /* Text */
  --text-primary: #111827;         /* Gray 900 */
  --text-secondary: #6B7280;       /* Gray 500 */
  --text-muted: #9CA3AF;           /* Gray 400 */
  
  /* Borders */
  --border: #E5E7EB;               /* Gray 200 */
  --border-hover: #D1D5DB;         /* Gray 300 */
  
  /* Components */
  --card-bg: #FFFFFF;
  --sidebar-bg: #FFFFFF;
  --header-bg: #FFFFFF;
  
  /* Employment Types */
  --contract: #A16AE8;
  --part-time: #8096FD;
  --full-time: #10B981;
  --eor: #F59E0B;
  
  /* Status */
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
}
```

#### Dark Mode
```css
.dark {
  /* Brand Colors (Slightly adjusted for dark bg) */
  --primary: #B88DF0;              /* Lighter Purple */
  --secondary: #98ACFF;            /* Lighter Blue */
  
  /* Background */
  --background: #0F172A;           /* Slate 900 */
  --background-secondary: #1E293B; /* Slate 800 */
  --background-tertiary: #334155;  /* Slate 700 */
  
  /* Text */
  --text-primary: #F1F5F9;         /* Slate 100 */
  --text-secondary: #CBD5E1;       /* Slate 300 */
  --text-muted: #94A3B8;           /* Slate 400 */
  
  /* Borders */
  --border: #334155;               /* Slate 700 */
  --border-hover: #475569;         /* Slate 600 */
  
  /* Components */
  --card-bg: #1E293B;              /* Slate 800 */
  --sidebar-bg: #0F172A;           /* Slate 900 */
  --header-bg: #1E293B;            /* Slate 800 */
  
  /* Employment Types (Adjusted for dark) */
  --contract: #B88DF0;
  --part-time: #98ACFF;
  --full-time: #34D399;
  --eor: #FBBF24;
  
  /* Status (Adjusted for dark) */
  --success: #34D399;
  --warning: #FBBF24;
  --error: #F87171;
  --info: #60A5FA;
}
```

### Tailwind CSS Configuration
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: '#A16AE8',
        secondary: '#8096FD',
        
        background: {
          DEFAULT: '#FFFFFF',
          secondary: '#F9FAFB',
          tertiary: '#F3F4F6',
        },
        
        // Dark mode handled via CSS variables
      },
    },
  },
}
```

### Component Adaptations

#### Card Component (Dark Mode)
```tsx
<Card className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
  <CardHeader>
    <CardTitle className="text-gray-900 dark:text-slate-100">
      Senior Developer
    </CardTitle>
  </CardHeader>
  <CardContent className="text-gray-600 dark:text-slate-300">
    Job description content...
  </CardContent>
</Card>
```

#### Button Component (Dark Mode)
```tsx
{/* Primary Button */}
<Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white">
  Create Job
</Button>

{/* Secondary Button */}
<Button variant="outline" className="border-gray-300 dark:border-slate-600 text-gray-900 dark:text-slate-100">
  Cancel
</Button>

{/* Ghost Button */}
<Button variant="ghost" className="hover:bg-gray-100 dark:hover:bg-slate-800">
  View More
</Button>
```

#### Badge Component (Dark Mode)
```tsx
{/* Contract Badge */}
<Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
  Contract
</Badge>

{/* Full-Time Badge */}
<Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
  Full-Time
</Badge>
```

#### Table Component (Dark Mode)
```tsx
<Table className="bg-white dark:bg-slate-800">
  <TableHeader className="bg-gray-50 dark:bg-slate-900">
    <TableRow className="border-b border-gray-200 dark:border-slate-700">
      <TableHead className="text-gray-900 dark:text-slate-100">Name</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700">
      <TableCell className="text-gray-900 dark:text-slate-100">Data</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

### Theme Toggle Component
```tsx
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from 'next-themes'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

### Dark Mode Implementation
```tsx
// app/layout.tsx or _app.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Gradient Adjustments (Dark Mode)
```css
/* Hero Gradient - Light Mode */
.hero-gradient {
  background: linear-gradient(135deg, #A16AE8 0%, #8096FD 100%);
}

/* Hero Gradient - Dark Mode */
.dark .hero-gradient {
  background: linear-gradient(135deg, #7C3AED 0%, #6366F1 100%);
  opacity: 0.9;
}

/* Card Gradient Accent - Light Mode */
.card-accent {
  border-top: 3px solid;
  border-image: linear-gradient(90deg, #A16AE8, #8096FD) 1;
}

/* Card Gradient Accent - Dark Mode */
.dark .card-accent {
  border-image: linear-gradient(90deg, #B88DF0, #98ACFF) 1;
}
```

### Chart Colors (Dark Mode)
```js
// Recharts configuration
const chartColors = {
  light: {
    primary: '#A16AE8',
    secondary: '#8096FD',
    success: '#10B981',
    grid: '#E5E7EB',
    text: '#6B7280',
  },
  dark: {
    primary: '#B88DF0',
    secondary: '#98ACFF',
    success: '#34D399',
    grid: '#334155',
    text: '#94A3B8',
  }
}
```

### Dark Mode Best Practices

1. **Contrast Ratios**: Maintain WCAG AA standards
   - Light mode: 4.5:1 minimum
   - Dark mode: 4.5:1 minimum (test against dark backgrounds)

2. **Avoid Pure Black**: Use `#0F172A` (Slate 900) instead of `#000000`

3. **Reduce Saturation**: Slightly desaturate colors in dark mode to reduce eye strain

4. **Shadow Adjustments**: Use lighter, more subtle shadows in dark mode
   ```css
   /* Light Mode */
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
   
   /* Dark Mode */
   box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
   ```

5. **Image Handling**: Reduce opacity of images in dark mode
   ```tsx
   <img className="opacity-100 dark:opacity-80" />
   ```

6. **Focus Indicators**: Ensure visible in both modes
   ```css
   /* Light Mode */
   .focus-visible:focus {
     outline: 2px solid #A16AE8;
   }
   
   /* Dark Mode */
   .dark .focus-visible:focus {
     outline: 2px solid #B88DF0;
   }
   ```

---

## Next Steps

1. **Create Figma mockups** with actual content and data for all wireframes
2. **Develop component storybook** for UI components with dark mode variants
3. **Build responsive prototypes** for user testing
4. **Implement drag-and-drop** for candidate pipeline with react-beautiful-dnd
5. **Add animations** with Framer Motion or Tailwind transitions
6. **Test accessibility** in both light and dark modes
7. **Optimize performance** for large candidate lists (virtualization)
