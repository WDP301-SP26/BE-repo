# BE-repo

Backend repository built with NestJS framework.

## Project setup

```bash
$ npm install
```

## Development

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Testing

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Docker

Build and run the application using Docker:

```bash
# Build the Docker image
$ docker build -t be-repo ./

# Run the container
$ docker run -p 3000:3000 be-repo
```

The application will be available at `http://localhost:3000/`

## CI/CD

This repository uses GitHub Actions for continuous integration and deployment:

- **Build and Test**: Runs tests and builds the application on PR and push to main
- **Docker Build and Test**: Builds Docker image and validates the application is running correctly

## Branch Naming Conventions

### Naming Rules

- Use lowercase with hyphens: `feature/add-user-authentication`
- Keep it short and descriptive (Max 3–5 words)
- Prefix with a category: `feature/`, `fix/`, `hotfix/`, etc.
- Avoid special characters, ambiguous names, or overly long names

### Branch Categories

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New features | `feature/add-search-filter` |
| `fix/` | Bug fixes | `fix/login-error-mobile` |
| `hotfix/` | Critical production fixes | `hotfix/critical-api-fix` |
| `chore/` | Maintenance tasks | `chore/update-dependencies` |
| `docs/` | Documentation updates | `docs/update-readme` |
| `refactor/` | Code refactoring | `refactor/simplify-auth-logic` |

## Commit Message Conventions

### Format

```
<type>(<optional scope>): <description>
```

### Rules

- Use imperative, present tense: "add" not "added" or "adds"
- Do not capitalize the first letter
- Do not end with a period
- Keep description concise (1-100 characters)

### Commit Types

| Type | Purpose | Example |
|------|---------|---------|
| `feat` | New feature or functionality | `feat(auth): add login endpoint` |
| `fix` | Bug fix | `fix(api): resolve null pointer error` |
| `refactor` | Code restructuring without behavior change | `refactor: simplify user service` |
| `perf` | Performance improvements | `perf: optimize database queries` |
| `style` | Code formatting (whitespace, semicolons) | `style: fix indentation` |
| `test` | Add or update tests | `test: add unit tests for auth` |
| `docs` | Documentation changes | `docs: update api documentation` |
| `build` | Build system or dependencies | `build: update nestjs to v10` |
| `ops` | Infrastructure, deployment, CI/CD | `ops: configure docker compose` |
| `chore` | Other changes (gitignore, configs) | `chore: init` |
