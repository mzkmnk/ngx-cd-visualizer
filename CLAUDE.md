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

## ngx-cd-visualizer 実装プラン

### プロジェクト概要
Angular 20のOnPush戦略とSignals導入に伴い、変更検知の伝播をリアルタイムで可視化するライブラリを構築します。開発者がアプリケーションを操作した際に、どのコンポーネントで変更検知が発生しているかを直感的に把握できるUIを提供します。

### 主要機能
1. **オーバーレイUI**: 画面右下にドラッグ可能な小さなウィンドウを表示
2. **コンポーネントツリー表示**: アプリケーションのコンポーネント階層を視覚化
3. **リアルタイム変更検知監視**: 変更検知が発生したコンポーネントを即座にハイライト
4. **状態インジケーター**: 変更検知の状態を色分けで表示（アクティブ/非アクティブ/OnPush）
5. **最小化/展開機能**: 開発時の邪魔にならないよう表示をコントロール

### 実装Phase

#### Phase 1: コアアーキテクチャ
- **データモデル定義**: `ComponentNode`, `ChangeDetectionEvent` インターフェース
- **ChangeDetectionMonitorService**: Zone.js hooks を使用した変更検知イベントの監視
- **ComponentTreeService**: ApplicationRef を使用したコンポーネントツリー解析

#### Phase 2: UI コンポーネント
- **VisualizerOverlayComponent**: メインのオーバーレイウィンドウ（ドラッグ対応）
- **ComponentTreeComponent**: ツリー構造の表示コンポーネント
- **ComponentNodeComponent**: 個別ノードの表示とインタラクション
- **レスポンシブ設計**: 最小化/展開機能とサイズ調整

#### Phase 3: 統合とAPI
- **provideNgxCdVisualizer()**: 簡単な統合のためのProvider関数
- **設定オプション**: 表示設定、フィルタリング、テーマカスタマイズ
- **パフォーマンス最適化**: 本番環境での自動無効化オプション

#### Phase 4: デモとテスト
- **デモアプリケーション強化**: OnPush/Signal使用例の追加
- **ユニットテスト**: コアサービスとコンポーネントのテスト
- **E2Eテスト**: 実際の変更検知シナリオの検証

### 技術的アプローチ
- **Angular ApplicationRef**: コンポーネントツリーの取得と監視
- **Zone.js Hooks**: 変更検知サイクルのイベント捕捉
- **Signals**: リアクティブなUI更新とパフォーマンス最適化
- **CSS Custom Properties**: テーマとスタイルのカスタマイズ
- **Standalone Components**: Angular 20のモダンアーキテクチャに準拠

### APIデザイン概要
```typescript
// プロバイダー関数
export function provideNgxCdVisualizer(config?: CdVisualizerConfig): Provider[]

// 設定インターフェース
export interface CdVisualizerConfig {
  enabled?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  showOnlyChanges?: boolean;
  excludeComponents?: string[];
}

// メインサービス
export class CdVisualizerService {
  readonly componentTree: Signal<ComponentNode[]>;
  readonly activeChanges: Signal<ChangeDetectionEvent[]>;
  
  toggle(): void;
  minimize(): void;
  expand(): void;
}
```

### 使用方法
```typescript
// main.ts
import { provideNgxCdVisualizer } from '@mzkmnk/ngx-cd-visualizer';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgxCdVisualizer({
      enabled: !environment.production,
      position: 'bottom-right',
      theme: 'dark'
    })
  ]
});
```

## angular best practices

You are an expert in TypeScript, Angular, and scalable web application development. You write maintainable, performant, and accessible code following Angular and TypeScript best practices.
## TypeScript Best Practices
- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain
## Angular Best Practices
- Always use standalone components over NgModules
- Don't use explicit `standalone: true` (it is implied by default)
- Use signals for state management
- Implement lazy loading for feature routes
- Use `NgOptimizedImage` for all static images.
## Components
- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- DO NOT use `ngStyle`, use `style` bindings instead
## State Management
- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
## Templates
- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
## Services
- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

# Angular

Angular — Deliver web apps with confidence 🚀

## Table of Contents

- [What is Angular](https://angular.dev/overview)
- [Installation guide](https://angular.dev/installation)
- [Style Guide](https://next.angular.dev/style-guide)

## Components

- [What is a component](https://angular.dev/guide/components)
- [Component selectors](https://angular.dev/guide/components/selectors)
- [Styling components](https://angular.dev/guide/components/styling)
- [Accepting data with input properties](https://angular.dev/guide/components/inputs)
- [Custom events with output](https://angular.dev/guide/components/outputs)
- [Content projection](https://angular.dev/guide/components/content-projection)
- [Component lifecycle](https://angular.dev/guide/components/lifecycle)

## Templates guides

- [Template Overview](https://angular.dev/guide/templates)
- [Adding event listeners](https://angular.dev/guide/templates/event-listeners)
- [Binding text, properties and attributes](https://angular.dev/guide/templates/binding)
- [Control Flow](https://angular.dev/guide/templates/control-flow)
- [Template variable declaration](https://angular.dev/guide/templates/variables)
- [Deferred loading of components](https://angular.dev/guide/templates/defer) 
- [Expression syntax](https://angular.dev/guide/templates/expression-syntax)

## Directives

- [Directives overview](https://angular.dev/guide/directives)
- [Attribute directives](https://angular.dev/guide/directives/attribute-directives)
- [Structural directives](https://angular.dev/guide/directives/structural-directives)
- [Directive composition](https://angular.dev/guide/directives/directive-composition-api)
- [Optimizing images](https://angular.dev/guide/image-optimization)

## Signals 

- [Signals overview](https://angular.dev/guide/signals)
- [Dependent state with linkedSignal](https://angular.dev/guide/signals/linked-signal)
- [Async reactivity with resources](https://angular.dev/guide/signals/resource)

## Dependency injection (DI)

- [Dependency Injection overview](https://angular.dev/guide/di)
- [Understanding Dependency injection](https://angular.dev/guide/di/dependency-injection)
- [Creating an injectable service](https://angular.dev/guide/di/creating-injectable-service)
- [Configuring dependency providers](https://angular.dev/guide/di/dependency-injection-providers)
- [Injection context](https://angular.dev/guide/di/dependency-injection-context)
- [Hierarchical injectors](https://angular.dev/guide/di/hierarchical-dependency-injection)
- [Optimizing Injection tokens](https://angular.dev/guide/di/lightweight-injection-tokens)

## RxJS 

- [RxJS interop with Angular signals](https://angular.dev/ecosystem/rxjs-interop)
- [Component output interop](https://angular.dev/ecosystem/rxjs-interop/output-interop)

## Loading Data

- [HttpClient overview](https://angular.dev/guide/http)
- [Setting up the HttpClient](https://angular.dev/guide/http/setup)
- [Making requests](https://angular.dev/guide/http/making-requests)
- [Intercepting requests](https://angular.dev/guide/http/interceptors)
- [Testing](https://angular.dev/guide/http/testing)

## Forms
- [Forms overview](https://angular.dev/guide/forms)
- [Reactive Forms](https://angular.dev/guide/forms/reactive-forms)
- [Strictly types forms](https://angular.dev/guide/forms/typed-forms)
- [Template driven forms](https://angular.dev/guide/forms/template-driven-forms)
- [Validate forms input](https://angular.dev/guide/forms/form-validation)
- [Building dynamic forms](https://angular.dev/guide/forms/dynamic-forms)

## Routing
- [Routing overview](https://angular.dev/guide/routing)
- [Define routes](https://angular.dev/guide/routing/define-routes)
- [Show routes with outlets](https://angular.dev/guide/routing/show-routes-with-outlets)
- [Navigate to routes](https://angular.dev/guide/routing/navigate-to-routes)
- [Read route state](https://angular.dev/guide/routing/read-route-state)
- [Common routing tasks](https://angular.dev/guide/routing/common-router-tasks)
- [Creating custom route matches](https://angular.dev/guide/routing/routing-with-urlmatcher)

## Server Side Rendering (SSR)

- [SSR Overview](https://angular.dev/guide/performance)
- [SSR with Angular](https://angular.dev/guide/ssr)
- [Build-time prerendering (SSG)](https://angular.dev/guide/prerendering)
- [Hybrid rendering with server routing](https://angular.dev/guide/hybrid-rendering)
- [Hydration](https://angular.dev/guide/hydration)
- [Incremental Hydration](https://angular.dev/guide/incremental-hydration)

# CLI 
[Angular CLI Overview](https://angular.dev/tools/cli)

## Testing

- [Testing overview](https://angular.dev/guide/testing)
- [Testing coverage](https://angular.dev/guide/testing/code-coverage)
- [Testing services](https://angular.dev/guide/testing/services)
- [Basics of component testing](https://angular.dev/guide/testing/components-basics)
- [Component testing scenarios](https://angular.dev/guide/testing/components-scenarios)
- [Testing attribute directives](https://angular.dev/guide/testing/attribute-directives)
- [Testing pipes](https://angular.dev/guide/testing/pipes)
- [Debugging tests](https://angular.dev/guide/testing/debugging)
- [Testing utility apis](https://angular.dev/guide/testing/utility-apis)
- [Component harness overview](https://angular.dev/guide/testing/component-harnesses-overview)
- [Using component harness in tests](https://angular.dev/guide/testing/using-component-harnesses)
- [Creating a component harness for your components](https://angular.dev/guide/testing/creating-component-harnesses)

## Animations
- [Animations your content](https://angular.dev/guide/animations/css)
- [Route transition animation](https://angular.dev/guide/animations/route-animations)
- [Migrating to native CSS animations](https://next.angular.dev/guide/animations/migration)

## APIs
- [API reference](https://angular.dev/api)
- [CLI command reference](https://angular.dev/cli)


## Others

- [Zoneless](https://angular.dev/guide/zoneless)
- [Error encyclopedia](https://angular.dev/errors)
- [Extended diagnostics](https://angular.dev/extended-diagnostics)
- [Update guide](https://angular.dev/update-guide)
- [Contribute to Angular](https://github.com/angular/angular/blob/main/CONTRIBUTING.md)
- [Angular's Roadmap](https://angular.dev/roadmap)
- [Keeping your projects up-to-date](https://angular.dev/update)
- [Security](https://angular.dev/best-practices/security)
- [Internationalization (i18n)](https://angular.dev/guide/i18n)