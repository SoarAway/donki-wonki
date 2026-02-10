# CI/CD Pipeline & Git Workflow

## Overview 

This document defines the branching strategy, commit conventions, and CI/CD pipeline for the Donki-Wonki project.

---

## Development Workflow   

All development work must be tracked via tickets to ensure traceability. 

1.  **Create Ticket**:
    *   Go to the [Notion ticketing board](https://www.notion.so/Donki-Wonki-2f6bb9f9e5f98018a5bbd56df9c5b883).
    *   [Create a new ticket](https://www.notion.so/302bb9f9e5f980f09381d66d37016e34) for your task.
    *   Obtain the Ticket ID.
    *   **Note**: Always raise a new ticket for a new task.

2.  **Branching**:
    *   In your own working branch (`app/app_<Name>` or `server/server_<Name>`), branch out new branch.
    *   **Naming Convention**: `<ticket_id>-<short_desc>`
        *   Example: `TICKET-1-login-ui`

3.  **Development**:
    *   Develop in that ticket branch.
    *   **Record all findings, exploration, blockers, and thought process in each of their notion ticket.**
    *   Purpose: Easier to refer which commit is for which ticket.

## Branching Strategy

### Branch Hierarchy

```
main (production-ready)
  ├── app/ (mobile app integration)
  │   ├── app/app_Ash (developer: Ash's personal working branch)
  │   │   └── TICKET-1-login-ui (Ticket branch)
  │   ├── app/app_Bob (developer: Bob's personal working branch)
  │   └── app/app_Charlie (developer: Charlie's personal working branch)
  │
  └── server/ (backend integration)
      ├── server/server_Diana (developer: Diana's personal working branch)
      │   └── TICKET-2-api-endpoints (Ticket branch)
      ├── server/server_Eve (developer: Eve's personal working branch)
      └── server/server_Frank (developer: Frank's personal working branch)
```

### Branch Types

| Branch | Purpose | Naming Convention | Merge To |
|--------|---------|-------------------|----------|
| `main` | Production-ready code | `main` | N/A |
| `app/` | Mobile app integration | `app/` | `main` |
| `server/` | Backend integration | `server/` | `main` |
| Personal working | Individual developer work | `app/app_<Name>` or `server/server_<Name>` | `app/` or `server/` |
| Ticket Branch | Specific Task | `<ticket_id>-<short_desc>` | Personal working branch |

### Branch Naming Convention

**Format:**
*   Personal: `<workspace>/<workspace>_<DeveloperName>`
*   Ticket: `<ticket_id>-<short_desc>`

**Examples:**
```
app/app_Ashley
TICKET-1-login-ui
server/server_Diana
TICKET-2-api-endpoints
```

## Commit Convention

### Format

```
<type>(<scope>): <description>
```

### Types

| Type | Description | Example |
|------|-------------|---------|
| `feat` | New feature | `feat(auth): add Google OAuth login` |
| `fix` | Bug fix | `fix(api): resolve null pointer in user endpoint` |
| `docs` | Documentation | `docs: update API documentation` |
| `style` | Code formatting | `style(button): update primary color` |
| `refactor` | Code refactoring | `refactor(utils): simplify date formatting` |
| `test` | Tests | `test(auth): add login unit tests` |
| `chore` | Maintenance | `chore(deps): upgrade React to v18` |

### Scope Examples

**Mobile App (`app/`):**
- `auth` - Authentication
- `onboarding` - Onboarding flow
- `home` - Home screen
- `routes` - Route management
- `settings` - Settings screen
- `components` - Shared components

**Backend (`server/`):**
- `scraper` - Reddit/Twitter scraping
- `ai` - Gemini AI integration
- `alerts` - Alert processing
- `routes` - Route matching
- `firebase` - Firebase integration
- `models` - Data models

### Rules 

1. **Use lowercase** for type and scope
2. **Use imperative mood** ("add" not "added")
3. **Keep subject under 72 characters**
4. **One commit = one logical change** (atomic commits)

### Examples

```bash
# Good commits
git commit -m "feat(scraper): add Reddit post fetching"
git commit -m "fix(alerts): resolve duplicate notification bug"
git commit -m "refactor(routes): extract station graph logic"
git commit -m "test(ai): add Gemini extraction tests"

# Bad commits (avoid)
git commit -m "update stuff"
git commit -m "feat: add scraper, fix bugs, update docs"
git commit -m "WIP"
```

## Best Practices

### Do's ✅

- ✅ Pull latest changes before starting work
- ✅ Commit frequently with atomic commits
- ✅ Write descriptive commit messages
- ✅ Push your branch daily
- ✅ Keep branches short-lived (< 1 week)
- ✅ Test before merging to integration branch
- ✅ Delete merged feature branches

### Don'ts ❌

- ❌ Commit directly to `main`
- ❌ Mix unrelated changes in one commit
- ❌ Use vague commit messages ("fix", "update")
- ❌ Keep branches open for weeks
- ❌ Force push to shared branches
- ❌ Commit sensitive data (API keys, credentials)

---

## Quick Reference

### Common Commands

```bash
# Create personal working branch
git checkout -b app/app_<YourName>  # or server/server_<YourName>
# Create ticket branch
git checkout -b TICKET-1-short-desc

# Commit changes
git add <files>
git commit -m "<type>(<scope>): <description>"

# Push regularly
git push origin app/app_Ash  # or server/server_Diana
```
# Push branch
git push origin app/app_<YourName>

# Update from integration branch
git pull origin app/

# Merge to integration branch
git checkout app/
git merge app/app_<YourName>
git push origin app/

# Merge to main
git checkout main
git merge app/
git push origin main
```

---

## Summary

**Branch Flow:**
```
main ← app/ ← app/app_Ash (Ash's work)
            ← app/app_Bob (Bob's work)
     ← server/ ← server/server_Diana (Diana's work)
              ← server/server_Eve (Eve's work)
```

**Commit Format:**
```
<type>(<scope>): <description>
```

**Integration:**
- Personal working branches (`app/app_<Name>`) merge to `app/` or `server/`
- Integration branches merge to `main`
- CI/CD runs on all merges
