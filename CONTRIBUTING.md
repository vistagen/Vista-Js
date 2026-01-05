# Contributing to Vista

Thank you for your interest in contributing to Vista! This is an alpha-stage framework, and we welcome your help to make it stable and feature-rich.

## 🚨 IMPORTANT RULES

**Please follow these core rules strictly:**

1.  **NEVER push directly to the `main` branch.**
    *   The `main` branch is protected. Direct pushes will be rejected.
2.  **Create your own branch** for every change.
    *   Development happens on feature branches.
3.  **One feature = One branch.**
    *   Keep your changes focused. Don't bundle multiple features in one PR.

---

## 🛠️ Development Workflow

### 1. Fork & Clone
Fork the repository to your own GitHub account, then clone it locally:

```bash
git clone https://github.com/YOUR-USERNAME/Vista-Js.git
cd Vista-Js
```

### 2. Create a Branch
**Always** create a new branch from `main` before you start working:

```bash
git checkout main
git pull origin main
git checkout -b feature/my-new-feature
# or for fixes
git checkout -b fix/bug-description
```

### 3. Setup Environment

*   **Node.js:** 20+
*   **pnpm:** 8+
*   **Rust:** Stable toolchain

```bash
# Install dependencies
pnpm install

# Build Rust bindings
cd crates/vista-napi
npm run build
cd ../..
```

### 4. Make Changes
Write your code!
*   **TypeScript/JS:** We use Prettier & ESLint. Run `pnpm lint` before committing.
*   **Rust:** Use `cargo fmt` and `cargo clippy`.

### 5. Push & Pull Request
Once you are happy with your changes:

```bash
git add .
git commit -m "feat: description of my awesome feature"
git push origin feature/my-new-feature
```

Then, go to the GitHub repository and open a **Pull Request (PR)** targeting the `main` branch.

---

## 📂 Project Structure

*   `crates/` - Rust core logic (N-API bindings, SWC transforms)
*   `packages/` - JavaScript packages (`vista`, `create-vista-app`)
*   `apps/` - Example and test applications

## 💬 Community

If you have questions, please open an issue or start a discussion. We appreciate your code, feedback, and support in building the future of React frameworks!
