# Contributing to Vista

Thank you for your interest in contributing to Vista! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- Node.js 20+
- pnpm 8+
- Rust (stable toolchain)

### Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/vista.git
   cd vista
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Build the Rust native bindings**
   ```bash
   cd crates/vista-napi
   npm run build
   cd ../..
   ```

4. **Build all packages**
   ```bash
   pnpm build
   ```

5. **Run the test app**
   ```bash
   cd test-app
   npm run dev
   ```

## Project Structure

```
vista-source/
├── crates/                 # Rust crates
│   ├── vista-napi/        # N-API bindings for Node.js
│   └── vista-transforms/  # SWC transforms
├── packages/
│   ├── vista/             # Core framework
│   └── create-vista-app/  # CLI scaffolding tool
└── test-app/              # Test application
```

## Code Style

### TypeScript/JavaScript
- We use Prettier for formatting
- ESLint for linting
- Run `pnpm lint` before committing

### Rust
- Use `cargo fmt` for formatting
- Use `cargo clippy` for linting

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

## Questions?

Feel free to open an issue for any questions or concerns.
