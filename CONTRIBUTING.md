# Contributing to JSON-Stream-Lite

Thank you for your interest in contributing to JSON-Stream-Lite! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We welcome contributors of all experience levels.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [pnpm](https://pnpm.io/) package manager (v10.14.0 or later)

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/json-stream-lite.git
   cd json-stream-lite
   ```
3. Install dependencies:
   ```bash
   pnpm install
   ```
4. Build the project:
   ```bash
   pnpm compile
   ```
5. Run tests:
   ```bash
   pnpm test
   ```

## Development Workflow

### Project Structure

```
json-stream-lite/
├── packages/
│   └── json-stream-lite/     # Main library package
│       ├── src/              # Source files
│       │   ├── index.ts      # Public exports
│       │   ├── generators.ts # Generator functions
│       │   ├── json-parser.ts        # JSON parser implementation
│       │   ├── incremental-parser.ts # Base incremental parser
│       │   ├── parser.ts     # Abstract parser interface
│       │   └── utils.ts      # Utility functions
│       └── test/             # Test files
│           └── unit/         # Unit tests
├── scripts/                  # Build and utility scripts
├── examples/                 # Example usage scripts
└── docs-html/               # Generated HTML documentation
```

### Available Scripts

From the repository root:

- `pnpm compile` - Build all packages
- `pnpm test` - Run all tests
- `pnpm format` - Format code with Prettier
- `pnpm docs:gen` - Generate documentation

From the json-stream-lite package (`packages/json-stream-lite`):

- `pnpm test` - Run tests with Vitest
- `pnpm test:unit` - Run unit tests only
- `pnpm compile` - Build the package
- `pnpm compile:validate` - Type-check without emitting files

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode (from packages/json-stream-lite)
cd packages/json-stream-lite
pnpm vitest
```

### Code Style

- We use [Prettier](https://prettier.io/) for code formatting
- TypeScript strict mode is enabled
- Follow existing code patterns and conventions
- Run `pnpm format` before committing

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

Examples:

```
feat: add support for BigInt parsing
fix: handle escaped quotes in strings
docs: update README with streaming examples
```

## Submitting Changes

### Pull Request Process

1. Create a new branch for your feature or fix:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Make your changes and commit them with clear messages
3. Ensure all tests pass:
   ```bash
   pnpm test
   ```
4. Push your branch and open a Pull Request
5. Describe your changes in the PR description
6. Wait for review and address any feedback

### What We Look For

- Code quality and consistency
- Test coverage for new functionality
- Documentation updates when needed
- No breaking changes without discussion

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- A clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node.js version, OS, etc.)
- Sample code if applicable

### Feature Requests

We welcome feature suggestions! Please:

- Check existing issues first
- Describe the use case clearly
- Explain why this would be useful

## Questions?

If you have questions, feel free to:

- Open a GitHub issue
- Start a discussion in the repository

Thank you for contributing!
