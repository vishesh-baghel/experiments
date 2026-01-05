# Sensie Features & Roadmap

## MVP Feature Set (Months 1-3)

**Goal:** Build core learning system that works end-to-end, demonstrate Sensie's unique value

### Phase 1.1: Foundation (Weeks 1-2)

**Auth & User Management**
- ✅ Passphrase-based authentication
- ✅ Owner account creation
- ✅ Visitor mode (read-only)
- ✅ Session management (iron-session)

**Database & ORM**
- ✅ Prisma schema implementation
- ✅ Database migrations
- ✅ Seed data for development
- ✅ Typed query layer (lib/db/)

**Basic UI Shell**
- ✅ Next.js 15 App Router setup
- ✅ TailwindCSS + shadcn/ui components
- ✅ Responsive layout (header, sidebar, main)
- ✅ Dark/light theme toggle
- ✅ Master Roshi personality constants

### Phase 1.2: Core Learning Engine (Weeks 3-4)

**Topic & Subtopic Management**
- ✅ Create topic (manual input)
- ✅ Define subtopics hierarchy
- ✅ Sequential unlocking (complete previous to unlock next)
- ✅ Topic status tracking (queued, active, completed)

**Concept Teaching**
- ✅ Mastra Sensie Agent (basic)
- ✅ Teach concept with LLM-generated explanation
- ✅ Code examples and analogies
- ✅ Store concepts in database

**Socratic Questioning**
- ✅ Question generation (Mastra Question Agent)
- ✅ Ask initial foundational question
- ✅ User answer submission
- ✅ Answer evaluation (correct/shallow/wrong)
- ✅ Progressive hints (3 levels)
- ✅ Guiding questions (if wrong)

**Progress Tracking**
- ✅ Calculate mastery percentage
- ✅ Track questions answered/correct
- ✅ Update topic/subtopic mastery on completion
- ✅ Visual progress bars

### Phase 1.3: Chat Interface (Weeks 5-6)

**Learning Session**
- ✅ Start learning session for topic
- ✅ Message-based conversation
- ✅ Question/answer flow in chat
- ✅ Sensie personality in responses
- ✅ Session persistence (pause/resume)

**Commands**
- ✅ `/progress` - Show current topic progress
- ✅ `/topics` - List all topics
- ✅ `/hint` - Request hint for current question
- ✅ `/skip` - Skip question (limited)
- ✅ `/break` - Save and pause session

**UI/UX**
- ✅ Topic sidebar (active, completed, queued)
- ✅ Chat area with message history
- ✅ Input area with command palette
- ✅ Progress visualization (bars, percentages)
- ✅ Empty states with personality

### Phase 1.4: Spaced Repetition (Weeks 7-8)

**Review System**
- ✅ FSRS algorithm implementation (via `ts-fsrs` library)
- ✅ Schedule first review (based on FSRS scheduling)
- ✅ Review session flow
- ✅ Rating system (Again/Hard/Good/Easy)
- ✅ Review prioritization (oldest due first)
- ✅ `/review` command

**Review UI**
- ✅ Reviews due dashboard
- ✅ Review session interface
- ✅ Post-review summary
- ✅ Next review dates

### Phase 1.5: MVP Polish (Weeks 9-10)

**Difficulty Adaptation**
- ✅ Track answer accuracy
- ✅ Adjust question difficulty (1-5 levels)
- ✅ Adaptive question generation

**Gap Detection (Basic)**
- ✅ Detect wrong answers
- ✅ Ask guiding questions
- ✅ Offer to re-teach concept

**Visitor Mode**
- ✅ Anonymized real data
- ✅ Read-only access
- ✅ Real topic names, sanitized questions

**Testing**
- ✅ Unit tests for learning engine
- ✅ Integration tests for API routes
- ✅ E2E tests for critical flows

**Deployment**
- ✅ Vercel deployment
- ✅ Neon database setup
- ✅ Environment variables
- ✅ CI/CD pipeline

### MVP Deferred Features

The following features are intentionally deferred from MVP to maintain focus:

| Feature | Reason | Target Phase |
|---------|--------|--------------|
| Streak Freeze | Adds complexity, basic streaks first | Phase 2 |
| Daily Goal Tracking | Precise time tracking not needed initially | Phase 2 |
| Codebase Learning | Significant complexity (GitHub auth, analysis) | Phase 2 |
| Feynman Technique | Core Socratic method is priority | Phase 2 |
| Project-Based Learning | Requires codebase integration | Phase 2 |

### MVP Success Criteria

**Functional:**
- [ ] User can create topic and learn end-to-end
- [ ] Socratic questioning works effectively (semantic evaluation, 3 hints, 5 max attempts)
- [ ] 10 questions per subtopic with adaptive difficulty
- [ ] Mastery percentage updates correctly
- [ ] Spaced repetition schedules reviews (FSRS algorithm)
- [ ] Visitor mode demonstrates real usage (with private answer marking)
- [ ] Hard limit of 3 active topics enforced

**Quality:**
- [ ] No critical bugs
- [ ] Mobile responsive
- [ ] 90%+ uptime
- [ ] <500ms API response time

**Portfolio:**
- [ ] Deployed and live
- [ ] Visitor mode accessible
- [ ] GitHub repo public
- [ ] README with screenshots

---

## Post-MVP Phase 2: Enhanced Learning (Months 4-6)

### Phase 2.1: Feynman Technique

**Features:**
- [ ] Trigger Feynman exercise at 80% mastery
- [ ] "Explain like I'm 10" prompt
- [ ] LLM evaluation of explanation
- [ ] Probing questions for unclear parts
- [ ] Iterative refinement
- [ ] Mastery boost on completion

**UI:**
- [ ] Special Feynman exercise card
- [ ] Explanation editor (rich text)
- [ ] Feedback highlighting unclear parts

### Phase 2.2: Project-Based Learning

**Features:**
- [ ] User adds projects (name, description, repo URL)
- [ ] Sensie suggests projects based on learned topics
- [ ] Code submission for review
- [ ] Sensie analyzes code for concept application
- [ ] Feedback on misconceptions
- [ ] Project completion tracking

**UI:**
- [ ] Projects page
- [ ] Project suggestion cards
- [ ] Code review interface

### Phase 2.3: Codebase Learning

**Features:**
- [ ] User provides GitHub repo URL + learning goal
- [ ] Codebase Analyzer agent (using Task/Explore)
- [ ] Identify key files and patterns
- [ ] Generate teaching path
- [ ] Guided tour through code
- [ ] Socratic questions about code

**Implementation:**
- [ ] CodebaseAnalysis model
- [ ] Cache analyzed repos
- [ ] Integration with Explore agent

**UI:**
- [ ] Repo input modal
- [ ] Analysis progress indicator
- [ ] Code viewer with annotations

### Phase 2.4: Learning Analytics

**Features:**
- [ ] Daily/weekly/monthly stats
- [ ] Learning streaks
- [ ] Topics mastered over time
- [ ] Questions answered trends
- [ ] Review adherence rate
- [ ] Heatmap calendar

**UI:**
- [ ] Analytics dashboard
- [ ] Charts and visualizations
- [ ] Streak badges
- [ ] Achievements (milestone celebrations)

### Phase 2.5: Advanced Gap Detection

**Features:**
- [ ] LLM-powered misconception analysis
- [ ] Prerequisite concept mapping
- [ ] Automatic prerequisite teaching
- [ ] Gap severity classification
- [ ] Personalized learning paths based on gaps

---

## Post-MVP Phase 3: Ecosystem Integration (Months 7-9)

### Phase 3.1: Cross-Agent Context (Requires Overseer)

**Features:**
- [ ] Export learning context for Overseer
- [ ] Receive context from other agents
- [ ] Jack integration (content ideas from learning topics)
- [ ] Code Review agent integration (skill level awareness)

**Implementation:**
- [ ] Overseer API client
- [ ] Context push/pull endpoints
- [ ] Context caching

### Phase 3.2: Web Content Curation

**Features:**
- [ ] Search web for learning resources
- [ ] Scrape articles, docs, videos
- [ ] LLM summarization
- [ ] Relevance scoring
- [ ] Resource recommendations
- [ ] Track user-provided materials

**UI:**
- [ ] Resources panel in topic view
- [ ] Add resource button
- [ ] Resource cards with summaries

### Phase 3.3: Multi-Modal Learning

**Features:**
- [ ] Code execution (for programming topics)
- [ ] Diagram generation (Mermaid/Excalidraw)
- [ ] Interactive examples
- [ ] Visual explanations

**UI:**
- [ ] Code playground component
- [ ] Diagram renderer
- [ ] Interactive widgets

---

## Post-MVP Phase 4: Social & Collaborative (Months 10-12)

### Phase 4.1: Learning Paths Marketplace

**Features:**
- [ ] Export learning path (topics + subtopics + questions)
- [ ] Share learning path publicly
- [ ] Import others' learning paths
- [ ] Community curated paths
- [ ] Ratings and reviews

**Implementation:**
- [ ] Learning path export/import
- [ ] Public path gallery
- [ ] Path versioning

### Phase 4.2: Collaborative Learning

**Features:**
- [ ] Study groups (multiple users on same topic)
- [ ] Compare progress with peers
- [ ] Group challenges
- [ ] Leaderboards (optional)

**Requirements:**
- Multi-user deployment support
- Real-time sync (optional)
- Privacy controls

### Phase 4.3: Mobile App

**Features:**
- [ ] Native mobile app (React Native)
- [ ] Offline mode (sync when online)
- [ ] Push notifications for reviews
- [ ] Mobile-optimized UI

---

## Feature Prioritization Framework

### Tier 1: Must-Have (MVP)
Features that define Sensie's core value:
- ✅ Socratic questioning
- ✅ Spaced repetition
- ✅ Progressive mastery tracking
- ✅ Master Roshi personality

### Tier 2: Should-Have (Post-MVP Phase 2)
Features that significantly enhance learning:
- Feynman technique
- Codebase learning
- Project-based learning
- Advanced gap detection

### Tier 3: Nice-to-Have (Post-MVP Phase 3+)
Features that expand use cases:
- Cross-agent integration
- Multi-modal learning
- Web content curation
- Analytics dashboard

### Tier 4: Future (Phase 4+)
Features that scale beyond single-user:
- Learning paths marketplace
- Collaborative learning
- Mobile app

---

## Technical Debt & Refactoring Milestones

### After MVP (Month 4)
- [ ] Refactor learning engine into separate services
- [ ] Add comprehensive error handling
- [ ] Implement request caching
- [ ] Optimize database queries (N+1 issues)
- [ ] Add integration tests for all API routes

### After Phase 2 (Month 7)
- [ ] Extract Mastra agents into reusable modules
- [ ] Implement proper logging system
- [ ] Add performance monitoring (Vercel Analytics)
- [ ] Optimize LLM prompt engineering
- [ ] Reduce bundle size (code splitting)

### After Phase 3 (Month 10)
- [ ] Migrate to monorepo structure (if multiple apps)
- [ ] Implement rate limiting
- [ ] Add Redis caching layer
- [ ] Improve accessibility (WCAG AAA)
- [ ] Internationalization support

---

## Feature Flags

**Use feature flags for gradual rollout:**

```typescript
const FEATURE_FLAGS = {
  // MVP
  SOCRATIC_QUESTIONING: true,
  SPACED_REPETITION: true,
  BASIC_PROGRESS_TRACKING: true,

  // Post-MVP Phase 2
  FEYNMAN_TECHNIQUE: false,
  PROJECT_BASED_LEARNING: false,
  CODEBASE_LEARNING: false,
  ADVANCED_ANALYTICS: false,

  // Post-MVP Phase 3
  CROSS_AGENT_INTEGRATION: false,
  WEB_CONTENT_CURATION: false,
  MULTI_MODAL_LEARNING: false,

  // Post-MVP Phase 4
  LEARNING_PATHS_MARKETPLACE: false,
  COLLABORATIVE_LEARNING: false,
};
```

**Implementation:**
```typescript
// lib/feature-flags.ts
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] ?? false;
}

// Usage in components
{isFeatureEnabled('FEYNMAN_TECHNIQUE') && <FeynmanExerciseButton />}
```

---

## MVP Build Timeline (Detailed)

### Week 1: Foundation Setup
- Day 1-2: Project setup, dependencies, database schema
- Day 3-4: Auth system, user management
- Day 5-7: Basic UI shell, routing, layout

### Week 2: Database Layer
- Day 1-3: Prisma models, migrations, seed data
- Day 4-5: Typed query layer (lib/db/)
- Day 6-7: Database testing, optimization

### Week 3: Topic Management
- Day 1-2: Topic CRUD operations
- Day 3-4: Subtopic hierarchy, unlocking logic
- Day 5-7: Topic UI, sidebar, topic creation flow

### Week 4: Concept Teaching
- Day 1-3: Mastra Sensie Agent setup
- Day 4-5: Concept explanation generation
- Day 6-7: Concept teaching UI

### Week 5: Socratic Engine
- Day 1-3: Question generation (Mastra Question Agent)
- Day 4-5: Answer evaluation, feedback logic
- Day 6-7: Hint system, guiding questions

### Week 6: Chat Interface
- Day 1-3: Learning session management
- Day 4-5: Message UI, chat flow
- Day 6-7: Command system, input handling

### Week 7: Spaced Repetition
- Day 1-3: SM-2 algorithm implementation
- Day 4-5: Review scheduling, quality rating
- Day 6-7: Review UI, session flow

### Week 8: Progress Tracking
- Day 1-3: Mastery calculation logic
- Day 4-5: Progress visualization
- Day 6-7: Difficulty adaptation

### Week 9: Polish & Testing
- Day 1-2: Bug fixes, edge cases
- Day 3-4: Visitor mode implementation
- Day 5-7: Testing (unit, integration, E2E)

### Week 10: Deployment
- Day 1-2: Vercel setup, env vars
- Day 3-4: Production deployment, monitoring
- Day 5-7: Documentation, README, launch prep

---

## Success Metrics by Phase

### MVP (Month 3)
**Portfolio Goals:**
- [ ] Deployed and live
- [ ] 50+ GitHub stars
- [ ] 5+ positive testimonials
- [ ] Featured in personal portfolio

**Usage Goals:**
- [ ] Daily active usage (Vishesh uses it)
- [ ] 2-3 topics learned to 80%+ mastery
- [ ] 20+ reviews completed
- [ ] No critical bugs

### Phase 2 (Month 6)
**Portfolio Goals:**
- [ ] 200+ GitHub stars
- [ ] 3+ blog posts about Sensie
- [ ] 10+ visitor mode views/week

**Adoption Goals:**
- [ ] 10+ free deployments
- [ ] 5+ active users (beyond Vishesh)
- [ ] Positive feedback on learning effectiveness

### Phase 3 (Month 9)
**Ecosystem Goals:**
- [ ] Integrated with Jack agent
- [ ] Overseer beta users using Sensie
- [ ] Cross-agent value demonstrated

**Learning Goals:**
- [ ] 5+ topics fully mastered
- [ ] Codebase learning validated (learn from 2+ repos)
- [ ] Project-based learning completed

### Phase 4 (Month 12)
**Growth Goals:**
- [ ] 50+ free deployments
- [ ] 10+ shared learning paths
- [ ] Community contributors

**Revenue Goals (if applicable):**
- [ ] Overseer sales include Sensie users
- [ ] 5+ Sensie custom work inquiries

---

## Risk Mitigation

### Risk: MVP takes longer than 10 weeks
**Mitigation:**
- Cut scope: Remove difficulty adaptation, visitor mode polish
- Focus on core: Socratic + SRS + Progress
- Ship incomplete, iterate based on feedback

### Risk: Socratic method feels too slow/frustrating
**Mitigation:**
- Add "Quick Explain" mode (opt-in)
- Progressive hint system to avoid frustration
- User feedback early and often
- Option to skip questions (limited)

### Risk: Mastery calculation feels inaccurate
**Mitigation:**
- Iterate on formula based on usage
- Make weights configurable
- Add manual mastery override (admin)

### Risk: Spaced repetition reviews feel like a chore
**Mitigation:**
- Gamify reviews (streaks, badges)
- Quick review sessions (5-10 min)
- Snooze option
- Celebrate review completions

### Risk: Not enough differentiation from ChatGPT + prompts
**Mitigation:**
- Persistent progress tracking (ChatGPT can't do this)
- Automated spaced repetition (requires infrastructure)
- Gap detection and prerequisite teaching
- Project-based learning integration
- Codebase-aware learning

---

## Dependencies & Blockers

### MVP Blockers
- None (all MVP features are self-contained)

### Phase 2 Blockers
- None (enhanced learning is independent)

### Phase 3 Blockers
- **Overseer Launch:** Cross-agent integration requires Overseer to exist
  - Mitigation: Build placeholder API, integrate when ready

### Phase 4 Blockers
- **Multi-User Infrastructure:** Requires authentication upgrades
- **Mobile App:** Requires React Native expertise
  - Mitigation: Hire contractor or defer to Year 2

---

## Feature Implementation Checklist Template

For each feature, use this checklist:

```markdown
## Feature: [Name]

### Spec
- [ ] User stories written
- [ ] UI mockups created
- [ ] Database schema changes defined
- [ ] API contracts defined

### Implementation
- [ ] Database migrations
- [ ] API routes
- [ ] Business logic (lib/)
- [ ] UI components
- [ ] Error handling
- [ ] Loading states

### Testing
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual QA
- [ ] Edge cases covered

### Documentation
- [ ] README updated
- [ ] API docs
- [ ] User guide (if needed)

### Deployment
- [ ] Feature flag added
- [ ] Deployed to staging
- [ ] Tested in staging
- [ ] Deployed to production
- [ ] Monitoring enabled
```

---

**Next Steps:**
1. Start Week 1 of MVP build
2. Track progress against timeline
3. Adjust scope if falling behind
4. Ship MVP by Week 10
5. Gather feedback, iterate

**Last Updated:** 2026-01-04
