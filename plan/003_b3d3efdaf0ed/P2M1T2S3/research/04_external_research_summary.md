# External PRD Best Practices Research Summary

## PRD Structure and Essential Sections

### Standard PRD Sections (Industry Best Practices)

1. **Document Metadata**
   - Title, version, date, author
   - Status (draft, review, approved)

2. **Executive Summary**
   - High-level overview (1-2 paragraphs)
   - Primary goals and success metrics
   - Target audience

3. **Problem Statement**
   - What problem are we solving?
   - Why is it important?
   - What are the pain points?

4. **Goals & Success Metrics**
   - Specific, measurable goals
   - Key performance indicators (KPIs)
   - Success criteria

5. **Target Audience & User Personas**
   - Who are we building for?
   - User characteristics
   - User needs and motivations

6. **Functional Requirements**
   - Detailed feature specifications
   - User stories and use cases
   - Feature priorities (must-have, should-have, nice-to-have)

7. **Non-Functional Requirements**
   - Performance requirements
   - Security requirements
   - Scalability requirements
   - Reliability/availability

8. **User Experience & Design**
   - User flows
   - UI/UX requirements
   - Accessibility considerations

9. **Technical Considerations**
   - Architecture decisions
   - Technology stack
   - Integration requirements
   - Data models

10. **Assumptions, Dependencies & Constraints**
    - What we're assuming to be true
    - External dependencies
    - Technical and business constraints

11. **Risk Assessment**
    - Potential risks
    - Mitigation strategies

12. **Release Planning**
    - Phases and milestones
    - Timeline estimates

13. **Open Questions**
    - Issues to be resolved
    - Decisions needed

## Writing Clear, Testable Requirements

### SMART Criteria for Requirements

- **Specific**: Clear and unambiguous
- **Measurable**: Quantifiable outcomes
- **Achievable**: Realistic given constraints
- **Relevant**: Aligned with business goals
- **Time-bound**: Clear timeline

### User Story Template

```
As a [user persona],
I want to [perform action],
So that [benefit/value].

Acceptance Criteria:
- [ ] Given [context], when [action], then [outcome]
- [ ] [specific criterion]
```

### Given-When-Then Format

```gherkin
GIVEN a user is logged in
WHEN they click "Save"
THEN their changes are persisted to the database
AND a success message is displayed
```

### Avoiding Ambiguous Language

| Avoid           | Use Instead                              |
| --------------- | ---------------------------------------- |
| "fast"          | "responds in <200ms for 95% of requests" |
| "user-friendly" | "requires <3 clicks to complete task"    |
| "scalable"      | "handles 10,000 concurrent users"        |
| "soon"          | "within 5 seconds"                       |
| "good"          | "[specific quality metric]"              |

## Defining Success Criteria and Acceptance Criteria

### Product-Level Success Criteria

- **Business Metrics**: Revenue, conversion, retention
- **Engagement Metrics**: DAU/MAU, session length, feature usage
- **UX Metrics**: Task completion rate, error rate, satisfaction
- **Support Metrics**: Ticket volume, resolution time

### Story-Level Acceptance Criteria

```markdown
#### P1.M1.T1: User Authentication

**Acceptance Criteria:**

- [ ] Users can register with email and password
- [ ] Email validation requires @ symbol and domain
- [ ] Password must be at least 8 characters with 1 uppercase, 1 number
- [ ] Registration sends confirmation email
- [ ] Users can log in with registered credentials
- [ ] Failed login shows "Invalid credentials" message
- [ ] Session expires after 24 hours of inactivity
- [ ] Users can log out and are redirected to home
```

### Definition of Done (DoD)

```markdown
- [ ] Code written and reviewed
- [ ] Unit tests pass (>80% coverage)
- [ ] Integration tests pass
- [ ] Documentation updated
- [ ] Acceptance criteria met
- [ ] No critical bugs
- [ ] Performance benchmarks met
- [ ] Security review complete
```

## Common PRD Pitfalls and How to Avoid Them

### 1. Ambiguity and Vagueness

**Problem**: "Make it fast" or "Improve UX"

**Solution**:

- Use specific, measurable language
- Include concrete metrics
- Define "fast" quantitatively

### 2. Over-Specification (Solutioneering)

**Problem**: "Use React for the frontend" instead of stating what needs to be built

**Solution**:

- Focus on WHAT, not HOW
- Let engineers determine implementation
- State constraints separately

### 3. Under-Specification

**Problem**: Missing critical requirements discovered too late

**Solution**:

- Include all functional requirements
- Cover edge cases
- Specify error handling
- Include non-functional requirements

### 4. Contradictions and Inconsistencies

**Problem**: "System must always respond instantly" and "System must perform complex validation"

**Solution**:

- Review for conflicts
- Use traceability matrix
- Rubber duck testing
- Multi-person review

### 5. Ignoring the "Why"

**Problem**: Requirements without context

**Solution**:

- Always include problem statement
- Explain business value
- Connect to goals

### 6. Unrealistic Timelines or Scope

**Problem**: "Build complete system in 2 weeks"

**Solution**:

- Break into phases
- Get engineering estimates
- Plan for uncertainty

### 7. Lack of Stakeholder Alignment

**Problem**: Different teams have different understanding

**Solution**:

- Collaborative writing
- Sign-off process
- Regular reviews

### 8. Ignoring Non-Functional Requirements

**Problem**: Forgetting performance, security, accessibility

**Solution**:

- Include NFRs section
- Specify quantifiable metrics
- Consider compliance requirements

### 9. Not Defining "Done"

**Problem**: Unclear when requirement is complete

**Solution**:

- Definition of Done
- Acceptance criteria for each story
- Testable outcomes

### 10. Writing Once and Never Updating

**Problem**: PRD becomes stale as project evolves

**Solution**:

- Treat as living document
- Version control
- Regular updates
- Change log

## Avoiding Ambiguity and Contradictions

### Language Guidelines

- Use present tense
- Use active voice
- Avoid jargon (or define in glossary)
- Use consistent terminology
- Avoid subjective adjectives

### Glossary Creation

```markdown
## Glossary

| Term    | Definition                                                 |
| ------- | ---------------------------------------------------------- |
| Session | A user's authenticated interaction with the system         |
| PRP     | Product Requirement Prompt - a micro-PRD for a single task |
```

### Traceability Matrix

| Requirement | Feature        | Test Case | Status |
| ----------- | -------------- | --------- | ------ |
| REQ-001     | User Login     | TC-101    | Pass   |
| REQ-002     | Password Reset | TC-102    | Fail   |

### Cross-Referencing

- Link related requirements
- Reference external specifications
- Include dependencies
- Note conflicts

### Automated Validation

- PRD linters (if available)
- Consistency checks
- Completeness validation
- Format validation

## PRD Examples from Well-Known Companies

### Amazon: Working Backwards

- Start with press release
- Focus on customer benefit
- Include FAQ
- Then write PRD

### Google: X-Moonshot Format

- Problem statement
- Solution approach
- Technical feasibility
- Success metrics

### Meta: Data-Driven PRD

- Hypothesis-driven
- A/B test plan
- Metrics framework
- Experiment design

### Stripe: RFC Process

- Request for Comments
- Collaborative drafting
- Engineering feedback
- Iterative refinement

### Airbnb: Design Brief

- User research insights
- Design principles
- User journey maps
- Success criteria

### Netflix: Experiment-Focused

- A/B test plan
- Metric definitions
- Success thresholds
- Rollout criteria

## PRDs for AI/LLM-Based Systems

### Unique Challenges

- Non-deterministic outputs
- Model versioning
- Prompt engineering
- Cost management
- Rate limiting
- Context window limits
- Hallucination risks
- Bias and fairness

### AI-Specific PRD Structure

1. Model Requirements
   - Model selection criteria
   - Performance benchmarks
   - Cost constraints

2. Data Specifications
   - Training data requirements
   - Data quality standards
   - Privacy considerations

3. Prompt Engineering
   - Prompt templates
   - System prompts
   - Few-shot examples

4. Performance Metrics
   - Response quality metrics
   - Latency requirements
   - Cost per query

5. Safety and Ethics
   - Content moderation
   - Bias mitigation
   - Compliance requirements

6. Monitoring and Observability
   - Logging requirements
   - Metrics collection
   - Alert thresholds

7. Evaluation Strategy
   - Test datasets
   - Human evaluation
   - Automated testing

### AI/LLM Acceptance Criteria Template

```markdown
#### [Feature Name]

**Model Requirements:**

- Model: [specified model]
- Max tokens: [limit]
- Temperature: [setting]

**Acceptance Criteria:**

- [ ] Response time < [X]ms for 95% of requests
- [ ] Cost per request < $[X]
- [ ] Response quality score > [X] (human eval)
- [ ] No hallucinations on test set
- [ ] Passes safety evaluation

**Edge Cases to Handle:**

- Empty input
- Malicious input
- Context window exceeded
- Rate limit hit
- Model unavailable
```

## Templates and Checklists

### PRD Quality Checklist

#### Structure

- [ ] All required sections present
- [ ] Document metadata complete
- [ ] Table of contents included
- [ ] Glossary for technical terms

#### Content Quality

- [ ] Problem statement clear
- [ ] Goals are SMART
- [ ] User personas defined
- [ ] Requirements are specific
- [ ] Requirements are measurable
- [ ] Requirements are achievable
- [ ] Requirements are relevant
- [ ] Requirements are time-bound

#### Completeness

- [ ] Functional requirements complete
- [ ] Non-functional requirements included
- [ ] Edge cases considered
- [ ] Error handling specified
- [ ] Dependencies documented

#### Consistency

- [ ] No contradictions found
- [ ] Terminology consistent
- [ ] Cross-references accurate
- [ ] Traceability maintained

#### Testability

- [ ] Each requirement has acceptance criteria
- [ ] Success metrics defined
- [ ] Definition of Done included
- [ ] Test cases can be derived

#### Clarity

- [ ] No ambiguous language
- [ ] No undefined jargon
- [ ] No vague terms
- [ ] Clear prioritization

### User Story Template

```markdown
#### [Story ID]: [Story Title]

**As a** [user persona]
**I want** [specific action/feature]
**So that** [benefit/value]

**Context:**
[Additional background]

**Acceptance Criteria:**

- [ ] Given [context], when [action], then [outcome]
- [ ] [criterion 2]
- [ ] [criterion 3]

**Edge Cases:**

- [edge case 1]
- [edge case 2]

**Dependencies:**

- [dependency 1]
- [dependency 2]

**Story Points:** [estimate]
**Priority:** [Must/Should/Could]
```

### AI/LLM User Story Template

```markdown
#### [Story ID]: [AI Feature Title]

**As a** [user persona]
**I want** [AI capability]
**So that** [benefit]

**Model Requirements:**

- Model: [model name/version]
- Max tokens: [limit]
- Temperature: [setting]
- System prompt: [prompt]

**Acceptance Criteria:**

- [ ] Response quality > [X]% (human eval)
- [ ] Latency < [X]ms (p95)
- [ ] Cost per request < $[X]
- [ ] No hallucinations on [test set]
- [ ] Handles [edge cases]

**Testing Strategy:**

- Test dataset: [description]
- Human evaluation: [N] reviewers
- Automated tests: [description]

**Risks:**

- [risk 1]: [mitigation]
- [risk 2]: [mitigation]
```

## Additional Resources

### Books

- "Inspired" by Marty Cagan
- "The Lean Startup" by Eric Ries
- "Sprint" by Jake Knapp
- "Crossing the Chasm" by Geoffrey Moore

### Online Resources

- Atlassian Product Management
- ProductPlan Blog
- Mind the Product
- First Round Review

### Communities

- Product Coalition (Medium)
- r/ProductManagement (Reddit)
- Product School content
