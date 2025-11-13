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

## Next Steps

1. **Create Figma mockups** with actual content and data
2. **Develop component storybook** for UI components
3. **Build responsive prototypes** for user testing
4. **Implement dark mode** using Tailwind dark: variants
5. **Add animations** with Framer Motion or Tailwind transitions
