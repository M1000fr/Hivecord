# Contributing to Hivecord

First off, thank you for considering contributing to Hivecord! It's people like you that make Hivecord such a great tool.

## Code of Conduct

By participating in this project, you agree to abide by the terms of the CC-BY-NC-SA-4.0 License and maintain a respectful and professional environment.

## How Can I Contribute?

### Reporting Bugs

- **Check the FAQ/Documentation** to see if the issue is already covered.
- **Search existing issues** to ensure the bug hasn't already been reported.
- If you find a new bug, open a new issue. Include:
    - A clear and descriptive title.
    - Steps to reproduce the bug.
    - Expected vs actual behavior.
    - Your environment (Bun version, OS, etc.).

### Suggesting Enhancements

- Open an issue with the tag "enhancement".
- Explain why the feature would be useful.
- Provide examples of how the feature would work.

### Pull Requests

1.  **Fork the repository** and create your branch from `main`.
2.  **Install dependencies** using `bun install`.
3.  **Implement your changes**.
4.  **Follow the coding style**:
    - We use [Biome](https://biomejs.dev/) for linting and formatting.
    - Run `bun run lint` and `bun run format` before committing.
5.  **Check for errors**: Ensure your code passes TypeScript checks with `bun run typecheck`.
6.  **Commit your changes**: We use [Conventional Commits](https://www.conventionalcommits.org/).
    - Example: `feat(module): add new moderation command`
    - Example: `fix(config): resolve issue with string arrays`
7.  **Submit the PR**: Describe your changes in detail and link to any relevant issues.

## Development Setup

Hivecord is powered by **Bun**. Make sure you have it installed (v1.x).

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/hivecord.git
cd hivecord

# Install dependencies
bun install

# Start development mode
bun dev
```

## Project Structure

- `src/modules`: Feature-based modules (where most logic goes).
- `src/class`: Core framework classes.
- `src/decorators`: Custom TypeScript decorators.
- `src/di`: Dependency Injection system.

Thank you for your contribution!