# Contributing

## Getting Started

```bash
# Clone and install
git clone https://github.com/jacobshirley/json-stream-lite.git
cd json-stream-lite
pnpm install
```

## Development

```bash
pnpm compile      # Build the project
pnpm test         # Run tests
pnpm format       # Format code
```

## Commit Convention

Use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation
- `test:` Tests
- `refactor:` Refactoring
- `chore:` Maintenance
- `ci:` Continuous integration changes
- `bump:` Version bumps
- `perf:` Performance improvements
- `security:` Security fixes
- `release:` Release-related changes
- `revert:` Revert previous commits
- `style:` Code style changes (formatting, missing semi colons, etc.)

## Pull Requests

1. Fork and create a branch
2. Make changes with tests
3. Ensure `pnpm compile` and `pnpm test` pass
4. Submit PR against `master`

## Issues

Use GitHub issue templates for bugs and feature requests.
