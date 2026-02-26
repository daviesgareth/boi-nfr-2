import React, { useState } from 'react';
import { Crd, C } from '../components/shared';
import {
  BookOpen, BarChart3, Map, Building2, AlertTriangle, Search, FileText,
  Users, Shield, Database, ChevronRight, HelpCircle, Target, TrendingUp,
  Lock, Upload, Activity,
} from 'lucide-react';

// ─── Sections ────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    id: 'overview',
    icon: BookOpen,
    title: 'Getting Started',
    content: [
      {
        heading: 'What is this dashboard?',
        body: 'The Northridge Finance NFR Dashboard tracks Net Finance Retained (NFR) — the rate at which customers who finish a finance agreement go on to take out a new one. A higher NFR means stronger customer retention and repeat business.',
      },
      {
        heading: 'How to navigate',
        body: 'Use the tabs along the top to switch between views. Each tab focuses on a different angle of your NFR data — national summary, regional breakdowns, individual dealers, at-risk contracts, and more. Filters at the top of most pages let you narrow results by date range, fuel type, agreement type, and other dimensions.',
      },
      {
        heading: 'What are NFR windows?',
        body: 'NFR is measured across time windows relative to a contract\'s end date. For example, "−3 / +6" means we look 3 months before and 6 months after end date for a matching new contract. The available windows are: −3/+1, −6/+1, −3/+6, −3/+9, −3/+12, and −3/+18. Wider windows capture more matches but at a longer horizon.',
      },
      {
        heading: 'Timeframe filter',
        body: 'Most pages respect the global timeframe filter: Rolling 13 Months (default — always the latest 13 months of data), This Year, Last Year, or All Time. This controls which contract end dates are included in NFR calculations.',
      },
    ],
  },
  {
    id: 'nfr-overview',
    icon: BarChart3,
    title: 'NFR Overview',
    content: [
      {
        heading: 'What it shows',
        body: 'The headline view of your national NFR performance. Four key sections: KPI tiles at the top (total contracts, matched, NFR rate, and average days to re-finance), a retention curve chart, a scatter quadrant, and a monthly trend.',
      },
      {
        heading: 'Retention curve',
        body: 'Shows cumulative retention rate over time (area) alongside the monthly return rate (bars). The "End Date" reference line marks the contract termination point — matches to the left are early renewals, matches to the right are post-termination.',
      },
      {
        heading: 'Scatter quadrant',
        body: 'Plots dealer groups by volume (x-axis) vs NFR rate (y-axis). Top-right = high volume, high retention (stars). Bottom-right = high volume, low retention (needs attention). Hover over any dot to see the dealer group name and stats.',
      },
    ],
  },
  {
    id: 'regions',
    icon: Map,
    title: 'Region & Group',
    content: [
      {
        heading: 'What it shows',
        body: 'Breaks down NFR performance by geographical region and dealer group. Useful for spotting which areas are outperforming or underperforming the national average.',
      },
      {
        heading: 'How to use it',
        body: 'The bar chart ranks regions or groups by NFR rate. The colour coding shows performance relative to the national benchmark. Click on any bar or table row to drill into that segment.',
      },
    ],
  },
  {
    id: 'dealers',
    icon: Building2,
    title: 'Dealer Retention',
    content: [
      {
        heading: 'What it shows',
        body: 'A dealer-level view of retention performance. Each row in the table is a dealer, showing their contract volume, matches, NFR rate, and trend. This is the go-to view for dealer performance reviews.',
      },
      {
        heading: 'Key columns',
        body: 'Contracts = total ending contracts in the selected timeframe. Matched = customers who took a new agreement. NFR = the retained percentage. Use the search bar to find a specific dealer by name.',
      },
    ],
  },
  {
    id: 'at-risk',
    icon: AlertTriangle,
    title: 'At-Risk Pipeline',
    content: [
      {
        heading: 'What it shows',
        body: 'Contracts that are ending soon and have not yet been matched to a new agreement. This is your forward-looking retention risk view. It helps prioritise outreach to customers most likely to leave.',
      },
      {
        heading: 'KPI metrics',
        body: 'Total At-Risk = all unmatched ending contracts. Urgent = ending within 3 months. The dashboard also estimates Expected to Retain based on historical NFR rates, and breaks risk down by agreement type, region, make, and fuel type.',
      },
      {
        heading: 'Dealer Group Priority Table',
        body: 'Shows which dealer groups have the most at-risk contracts, their historical NFR rate, expected retentions, and a priority flag (High / Medium / Low). Focus outreach efforts on High-priority groups with large at-risk volumes.',
      },
    ],
  },
  {
    id: 'explorer',
    icon: Search,
    title: 'Data Explorer',
    content: [
      {
        heading: 'What it shows',
        body: 'A flexible, filterable table of all contract-level data. Use this when you need to look up individual contracts or build custom filtered views that the other tabs don\'t cover.',
      },
      {
        heading: 'Multi-select filters',
        body: 'Most filters support multi-select — for example, you can select both Petrol and Diesel fuel types, or multiple regions at once. Filters combine with AND logic, so adding more filters narrows the results.',
      },
      {
        heading: 'Exporting data',
        body: 'The Explorer is useful for verifying data at the contract level. You can see all 18+ enriched columns including registration date, mileage, colour, derivative, and more.',
      },
    ],
  },
  {
    id: 'agreements',
    icon: FileText,
    title: 'Agreement & Term',
    content: [
      {
        heading: 'What it shows',
        body: 'NFR performance split by agreement type (PCP, HP, Lease, etc.) and contract term length. Helps identify which product types have the strongest retention.',
      },
      {
        heading: 'Why it matters',
        body: 'Different agreement types have fundamentally different retention profiles. PCP customers may re-finance at a different rate to HP or Lease customers. Understanding this helps set realistic targets by product.',
      },
    ],
  },
  {
    id: 'matching',
    icon: Users,
    title: 'Customer Matching',
    content: [
      {
        heading: 'What it shows',
        body: 'Statistics about the customer matching engine that powers NFR calculations. The system uses Union-Find to link contracts to the same customer, even when names or details vary slightly.',
      },
      {
        heading: 'How matching works',
        body: 'Contracts are grouped into customer clusters using shared identifiers (registration, name, postcode, etc.). A "match" means we found a new contract for the same customer within an NFR window after their previous contract ended.',
      },
    ],
  },
  {
    id: 'admin',
    icon: Shield,
    title: 'Administration',
    adminOnly: true,
    content: [
      {
        heading: 'Who can access this?',
        body: 'Only users with the Admin role can see the Admin tab. It provides data management, user management, and audit logging.',
      },
      {
        heading: 'Data Management',
        body: 'Upload new data files (.xlsx or .csv), view database health metrics (contract counts, date ranges, database size), and purge all data if needed. The purge action requires typing "PURGE" to confirm and is logged in the audit trail.',
      },
      {
        heading: 'User Management',
        body: 'Create, edit, and delete user accounts. Assign roles: Admin (full access), Analyst (all analytics, no admin), or Viewer (read-only analytics). Each user\'s last login time is tracked.',
      },
      {
        heading: 'Audit Log',
        body: 'A paginated, filterable log of all system activity — logins, data uploads, purges, user changes, and page views. Filter by category or by individual user. Useful for compliance and tracking who did what.',
      },
    ],
  },
  {
    id: 'account',
    icon: Lock,
    title: 'Your Account',
    content: [
      {
        heading: 'Changing your password',
        body: 'Click your username in the top-right corner of the dashboard to open the user menu. Select "Change Password", enter your current password, then your new password (minimum 8 characters, must include uppercase, lowercase, and a number) twice to confirm.',
      },
      {
        heading: 'Signing out',
        body: 'Click your username in the top-right corner and select "Sign Out" from the dropdown menu. Your session will end and you\'ll be returned to the login page.',
      },
    ],
  },
];

// ─── Styles ──────────────────────────────────────────────────────────────────

const sidebarItem = (active) => ({
  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
  color: active ? C.navy : C.textMid,
  background: active ? 'rgba(0,53,95,0.06)' : 'transparent',
  transition: 'all 0.15s', textDecoration: 'none', border: 'none',
  width: '100%', textAlign: 'left', fontFamily: 'var(--font)',
});

const headingStyle = {
  fontSize: 15, fontWeight: 700, color: C.navy, margin: '24px 0 8px',
};

const bodyStyle = {
  fontSize: 13, lineHeight: 1.75, color: C.textMid, margin: 0,
};

const firstHeadingStyle = { ...headingStyle, marginTop: 0 };

// ─── Component ───────────────────────────────────────────────────────────────

export default function Wiki() {
  const [activeSection, setActiveSection] = useState('overview');

  const section = SECTIONS.find(s => s.id === activeSection) || SECTIONS[0];
  const Icon = section.icon;

  return (
    <div style={{ display: 'flex', gap: 24, minHeight: 500 }}>
      {/* Sidebar */}
      <div style={{ width: 220, flexShrink: 0 }}>
        <Crd style={{ position: 'sticky', top: 20, padding: '12px 10px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', marginBottom: 8,
            fontSize: 11, fontWeight: 700, color: C.textMuted,
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>
            <HelpCircle size={13} />
            Guide
          </div>
          {SECTIONS.map(s => {
            const SIcon = s.icon;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={sidebarItem(activeSection === s.id)}
              >
                <SIcon size={14} style={{ flexShrink: 0, opacity: 0.7 }} />
                <span>{s.title}</span>
                {s.adminOnly && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 9, fontWeight: 700, padding: '1px 5px',
                    borderRadius: 3, background: '#FEF3C7', color: '#92400E',
                  }}>
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </Crd>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Crd>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingBottom: 16, marginBottom: 8,
            borderBottom: `1px solid ${C.borderLight}`,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: 'rgba(0,53,95,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} color={C.navy} />
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: C.navy }}>{section.title}</div>
              {section.adminOnly && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px',
                  borderRadius: 3, background: '#FEF3C7', color: '#92400E',
                }}>
                  Admin only
                </span>
              )}
            </div>
          </div>

          {section.content.map((block, i) => (
            <div key={i}>
              <h3 style={i === 0 ? firstHeadingStyle : headingStyle}>{block.heading}</h3>
              <p style={bodyStyle}>{block.body}</p>
            </div>
          ))}
        </Crd>
      </div>
    </div>
  );
}
