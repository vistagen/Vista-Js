# Vista Framework: Development Roadmap & Features

**Project Status**: Alpha (Core Features Implemented)  
**Goal**: Create a high-performance, Next.js-compatible React framework powered by Rust.

---

## 🏛️ Architecture Overview

Vista implements a hybrid architecture combining the speed of Rust with the flexibility of React.

### Core Pillars

1.  **Rust-Powered Build**: Uses SWC and custom Rust binaries for blazing fast compilation and file system operations.
2.  **App Router Compatible**: Fully supports the `app/` directory model, file-system routing, and nested layouts.
3.  **React Server Components (RSC)**: Implements the "Server First" mental model where components render on the server by default.

---

## ✅ Completed Features

### 1. Build & Core

- [x] **SWC + Webpack Pipeline**: Optimized build configuration with Hot Module Replacement (HMR).
- [x] **Dual Runtime**: Distinct server (Node.js) and client (Browser) execution environments.
- [x] **Rust Native Bindings**: Custom NAPI-RS modules for analyzing component directives (`'client load'`) and building route trees.

### 2. Routing System

- [x] **File-System Routing**: `page.tsx`, `layout.tsx`, `loading.tsx` support.
- [x] **Dynamic Routes**: `[slug]` and catch-all `[...slug]` segments.
- [x] **Route Groups**: Organization via `(folder)` convention.
- [x] **Nested Layouts**: Recursive wrapping of route segments.

### 3. Data & Metadata

- [x] **Metadata API**: Full compatibility with Next.js `metadata` object and `generateMetadata` function.
- [x] **SEO Injection**: Automatic injection of meta tags, OpenGraph, and Twitter cards during SSR.

### 4. Optimization

- [x] **`vista/image`**: Automatic blur placeholders, lazy loading, and priority fetching.
- [x] **`vista/link`**: Intelligent prefetching on viewport entry and hover.
- [x] **`vista/font`**: Self-hosted font optimization (in progress).

### 5. Server Features

- [x] **API Routes**: Support for `route.ts` with standard HTTP method exports (`GET`, `POST`, etc.).
- [x] **Middleware**: Edge-compatible `middleware.ts` for request interception and rewriting.
- [x] **Utilities**: Server-only helpers like `cookies()`, `headers()`, and `redirect()`.

### 6. Tooling

- [x] **CLI**: `create-vista-app` with Git initialization and TypeScript support.
- [x] **Config**: Standardized Rust toolchain, ESLint, and Prettier configurations.

---

## 🚧 In Progress: True RSC Architecture

We are currently refining the build system to strictly enforce the **React Server Component** architecture.

### ✅ Implemented RSC Features

1. **RSC Build Compiler** (`src/build/rsc/compiler.ts`)
   - Separate webpack configs for server and client bundles
   - Server bundle goes to `.vista/server/` - NEVER sent to client
   - Client bundle only contains `'client load'` components

2. **Component Manifests**
   - `client-manifest.json` - Registry of all client components
   - `server-manifest.json` - Registry of server components with routes

3. **RSC Renderer** (`src/build/rsc/rsc-renderer.ts`)
   - Renders server components to HTML on the server
   - Generates client references for hydration
   - Supports nested layouts and metadata

4. **Client Reference Plugin** (`src/build/rsc/client-reference-plugin.ts`)
   - Webpack plugin that replaces server component imports with proxies
   - Ensures server code never leaks to client bundle
   - Provides helpful error messages for misuse

5. **RSC Engine** (`src/server/rsc-engine.ts`)
   - Full RSC-aware Express server
   - RSC payload endpoint for client navigation
   - Route matching with dynamic/catch-all support

6. **Selective Hydration** (`src/client/hydration.ts`)
   - Only hydrates client component "islands"
   - Progressive hydration based on visibility
   - Minimal JavaScript for maximum performance

7. **Rust-Powered RSC Scanner** (`crates/vista-transforms/src/rsc/`)
   - **scanner.rs**: Blazing fast directory scanning (~10-100x faster than JS)
   - **manifest.rs**: Native client/server manifest generation
   - **serializer.rs**: RSC payload serialization with React Flight protocol

8. **NAPI Bindings** (`crates/vista-napi/src/lib.rs`)
   - `rsc_scan_app()` - Scan entire app directory in native code
   - `rsc_generate_client_manifest()` - Generate client component registry
   - `rsc_generate_server_manifest()` - Generate server component + route registry
   - `rsc_generate_mount_id()` - Unique mount IDs for hydration

9. **Hybrid Scanner** (`src/build/rsc/native-scanner.ts`)
   - Uses Rust when available, falls back to TypeScript
   - Automatic detection of native module availability
   - Zero-config performance boost

### Build Output Structure (`.vista/`)

| Directory | Purpose                                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| `server/` | **Server-Only Bundle**. Contains all app code. Used for SSR and accessing backend resources. Never sent to client. |
| `static/` | **Client Assets**. Contains only components marked `'client load'` and their dependencies.                         |
| `cache/`  | **Persistent Cache**. Stores build artifacts for immediate subsequent builds.                                      |

### Usage

```bash
# Development with RSC
vista dev --rsc

# Production build with RSC
vista build --rsc

# Start production server with RSC
vista start --rsc
```

### Technical Goals ✅

1.  **Strict Separation**: ✅ Server secrets (DB keys, internal APIs) cannot leak to the client bundle.
2.  **Zero-Bundle-Size Server Components**: ✅ Server components render to HTML and contribute strictly **0kb** to the JavaScript bundle.
3.  **Selective Hydration**: ✅ Only "islands" of interactivity (Client Components) hydrate on the browser.

---

## 🔮 Future Roadmap

### Short Term (v0.2)

- **Static Export**: Implementation of `output: 'export'` for purely static site generation.
- **Streaming SSR**: Breaking rendering work into chunks to improve Time To First Byte (TTFB).

### Medium Term (v0.5)

- **Error Boundaries**: Granular error handling via `error.tsx` files.
- **Suspense Integration**: First-class support for `loading.tsx` and React Suspense boundaries.

### Long Term (v1.0)

- **Parallel Routes**: rendering multiple pages in the same layout view (`@slot`).
- **Intercepting Routes**: Loading routes within the current layout context (`(..)`).
- **Server Actions**: RPC-like form submissions.

---

**"Vista: Speed of Rust, Joy of React."**
