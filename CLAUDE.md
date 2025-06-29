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