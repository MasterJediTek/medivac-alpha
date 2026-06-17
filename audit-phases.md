# Pre-Release Audit Phases

## Phase 1: Halt Production & Document Follow-ups
- Save all pending follow-up suggestions to todo.md with version markers
- Add production halt notice to todo.md
- Create checkpoint before audit begins
- Communicate halt to team

## Phase 2: Audit Project Files
- List all screens (tab-based and root-level)
- Count all services and identify imports
- Review components and utilities
- Check configuration files (app.config.ts, tailwind.config.js, etc.)
- Document file structure and architecture

## Phase 3: Analyse Outstanding Items
- Parse todo.md for all unchecked items (- [ ])
- Group by feature section and version
- Categorise by priority (critical, high, medium, low)
- Identify missed follow-ups from previous versions
- Calculate effort estimates for each item

## Phase 4: Assess System Health
- Identify functioning systems (production-ready)
- Identify partially implemented systems
- Identify not-yet-started systems
- Run test suite and document results
- Check for TypeScript/build errors
- Identify unused code and services

## Phase 5: Generate Executive Report
- Create comprehensive audit report document
- Include project scope and architecture overview
- Document feature completion status across all versions
- Create prioritised task list for v1.0 release
- Include risk assessment and success metrics
- Provide actionable recommendations

## Phase 6: Deliver Report
- Attach audit report to user message
- Summarise key findings
- Highlight critical path items
- Provide next steps for release planning
