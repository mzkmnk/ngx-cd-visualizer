# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

This is an Nx workspace with Angular applications and libraries. **This project uses pnpm as the package manager.**

### Package Manager
- **Package Manager**: pnpm (required)
- **Install dependencies**: `pnpm install`
- **Add dependency**: `pnpm add [package-name]`
- **Add dev dependency**: `pnpm add -D [package-name]`

### Core Development Commands
- **Start dev server**: `pnpm nx serve demo-ngx-cd-visualizer`
- **Build for production**: `pnpm nx build demo-ngx-cd-visualizer`
- **Build library**: `pnpm nx build ngx-cd-visualizer`
- **Run tests**: `pnpm nx test [project-name]` or `pnpm nx run-many -t test`
- **Run linting**: `pnpm nx lint [project-name]` or `pnpm nx run-many -t lint`
- **Run e2e tests**: `pnpm nx e2e demo-ngx-cd-visualizer-e2e`

### Build and Test All
- **Build all projects**: `pnpm nx run-many -t build`
- **Test all projects**: `pnpm nx run-many -t test`
- **Lint all projects**: `pnpm nx run-many -t lint`

### Project Information
- **Show project targets**: `pnpm nx show project [project-name]`
- **View dependency graph**: `pnpm nx graph`

## Architecture

This is an Nx monorepo containing:

### Applications
- **`demo-ngx-cd-visualizer`** (`apps/demo-ngx-cd-visualizer/`): Demo Angular application showcasing the ngx-cd-visualizer library

### Libraries
- **`ngx-cd-visualizer`** (`libs/ngx-cd-visualizer/`): Main Angular library for CD (Continuous Deployment) visualization
  - Published as `@mzkmnk/ngx-cd-visualizer`
  - Peer dependencies: Angular ^20.0.0
  - Currently in initial development phase (empty lib)

### Technology Stack
- **Package Manager**: pnpm (enforced via .npmrc and package.json)
- **Framework**: Angular 20.0.0 with standalone components
- **Build System**: Nx 21.2.1 with Angular CLI
- **Testing**: Jest for unit tests, Playwright for e2e
- **Linting**: ESLint with Angular ESLint rules
- **Packaging**: ng-packagr for library builds

### Key Configuration Files
- **`nx.json`**: Nx workspace configuration with target defaults and plugins
- **`tsconfig.base.json`**: TypeScript base configuration
- **`libs/ngx-cd-visualizer/ng-package.json`**: Library packaging configuration
- **`project.json`** files: Individual project configurations

### Development Notes
- Library source is currently empty (`libs/ngx-cd-visualizer/src/index.ts`)
- Demo app uses standard Angular standalone component architecture
- E2e tests configured with Playwright
- Release process configured with `npx nx release`