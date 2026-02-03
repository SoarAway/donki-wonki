# CI/CD Pipeline & Git Workflow

## Overview

This document defines the branching strategy, commit conventions, and CI/CD pipeline for the Donki-Wonki project.

---

## Branching Strategy

### Branch Hierarchy

```
main (production-ready)
  ├── app/ (mobile app integration)
  │   ├── app/app_Ash (developer: Ash's personal working branch)
  │   ├── app/app_Bob (developer: Bob's personal working branch)
  │   └── app/app_Charlie (developer: Charlie's personal working branch)
  │
  └── server/ (backend integration)
      ├── server/server_Diana (developer: Diana's personal working branch)
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

### Branch Naming Convention

**Format:** `<workspace>/<workspace>_<DeveloperName>`

**Examples:**
```
app/app_Ash
app/app_Bob
server/server_Diana
server/server_Eve
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
# Create feature branch
git checkout -b app/feat-<name>

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
