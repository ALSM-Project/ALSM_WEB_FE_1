import JSZip from 'jszip';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { ExportConfiguration, ExportFileItem, BundleMetrics } from '../types/export';
import { mockConversionResult } from '@/mocks/conversions.mock';
import { apiClient } from '@/services/api/apiClient';

export class ExportService {
  /**
   * Calls Backend REST API to generate file tree preview and metrics (ALSM-169)
   */
  async fetchExportPreviewFromApi(
    config: ExportConfiguration
  ): Promise<{ fileTree: ExportFileItem[]; metrics: BundleMetrics }> {
    try {
      const response = await apiClient.post<{ fileTree: ExportFileItem[]; metrics: BundleMetrics }>(
        `/projects/${config.projectId}/export/preview`,
        config
      );
      return response;
    } catch {
      const mockScreens: LegacyScreen[] = config.selectedScreenIds.map((id) => ({
        id,
        projectId: config.projectId,
        name: `${id}.bms`,
        sourceType: 'BMS',
        framework: 'React',
        status: 'Ready',
        complexity: 'Medium',
        fieldsCount: 15,
        targetFramework: 'React TypeScript',
        lastConverted: 'Just now',
        lastUpdated: 'Just now',
      }));
      return {
        fileTree: this.generateFileTreePreview(config, mockScreens),
        metrics: this.calculateMetrics(config, mockScreens),
      };
    }
  }

  /**
   * Calls Backend REST API to download ZIP package directly from NestJS server (ALSM-169)
   */
  async downloadZipBundleFromApi(
    config: ExportConfiguration,
    onProgress?: (percent: number, stepLabel: string) => void
  ): Promise<Blob> {
    try {
      onProgress?.(30, 'Connecting to ALSM Backend Export Engine...');
      const response = await apiClient.post<Blob>(
        `/projects/${config.projectId}/export/download`,
        config
      );
      onProgress?.(100, 'Package downloaded from Backend server!');
      return response;
    } catch {
      const mockScreens: LegacyScreen[] = config.selectedScreenIds.map((id) => ({
        id,
        projectId: config.projectId,
        name: `${id}.bms`,
        sourceType: 'BMS',
        framework: 'React',
        status: 'Ready',
        complexity: 'Medium',
        fieldsCount: 15,
        targetFramework: 'React TypeScript',
        lastConverted: 'Just now',
        lastUpdated: 'Just now',
      }));
      return this.generateZipBundle(config, mockScreens, onProgress);
    }
  }
  /**
   * Generates a virtual file tree for live UI preview based on current configuration
   */
  generateFileTreePreview(
    config: ExportConfiguration,
    screens: LegacyScreen[]
  ): ExportFileItem[] {
    const selectedScreens = screens.filter((s) =>
      config.selectedScreenIds.includes(s.id)
    );

    if (config.outputOption === 'standalone') {
      const componentFiles: ExportFileItem[] = selectedScreens.map((s) => ({
        path: `components/${this.getComponentName(s.name)}.tsx`,
        name: `${this.getComponentName(s.name)}.tsx`,
        size: '3.8 KB',
        type: 'file',
        language: 'typescript',
        content: this.getScreenTsxContent(s.name),
      }));

      if (config.includeUnitTests) {
        selectedScreens.forEach((s) => {
          componentFiles.push({
            path: `components/${this.getComponentName(s.name)}.test.tsx`,
            name: `${this.getComponentName(s.name)}.test.tsx`,
            size: '1.9 KB',
            type: 'file',
            language: 'typescript',
            content: this.getUnitTestContent(s.name),
          });
        });
      }

      componentFiles.push({
        path: 'components/index.ts',
        name: 'index.ts',
        size: '0.4 KB',
        type: 'file',
        language: 'typescript',
        content: selectedScreens
          .map((s) => `export * from './${this.getComponentName(s.name)}';`)
          .join('\n'),
      });

      const rootChildren: ExportFileItem[] = [
        {
          path: 'components',
          name: 'components',
          size: `${componentFiles.length} files`,
          type: 'dir',
          children: componentFiles,
        },
      ];

      if (config.includeDocumentation) {
        rootChildren.push({
          path: 'README.md',
          name: 'README.md',
          size: '1.2 KB',
          type: 'file',
          language: 'markdown',
          content: this.getReadmeContent(config, selectedScreens),
        });
      }

      return [
        {
          path: 'export-bundle',
          name: `${config.projectName.toLowerCase().replace(/\s+/g, '-')}-components`,
          size: 'Root',
          type: 'dir',
          children: rootChildren,
        },
      ];
    }

    if (config.outputOption === 'storybook') {
      const stories: ExportFileItem[] = [];
      selectedScreens.forEach((s) => {
        const compName = this.getComponentName(s.name);
        stories.push(
          {
            path: `src/components/${compName}.tsx`,
            name: `${compName}.tsx`,
            size: '3.8 KB',
            type: 'file',
            language: 'typescript',
            content: this.getScreenTsxContent(s.name),
          },
          {
            path: `src/components/${compName}.stories.tsx`,
            name: `${compName}.stories.tsx`,
            size: '1.5 KB',
            type: 'file',
            language: 'typescript',
            content: this.getStorybookContent(compName),
          }
        );
      });

      return [
        {
          path: 'project-root',
          name: `${config.projectName.toLowerCase().replace(/\s+/g, '-')}-storybook`,
          size: 'Root',
          type: 'dir',
          children: [
            {
              path: '.storybook',
              name: '.storybook',
              size: '2 files',
              type: 'dir',
              children: [
                {
                  path: '.storybook/main.ts',
                  name: 'main.ts',
                  size: '0.8 KB',
                  type: 'file',
                  language: 'typescript',
                  content: `import type { StorybookConfig } from '@storybook/react-vite';\nconst config: StorybookConfig = { stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'], addons: ['@storybook/addon-essentials'] };\nexport default config;`,
                },
                {
                  path: '.storybook/preview.ts',
                  name: 'preview.ts',
                  size: '0.4 KB',
                  type: 'file',
                  language: 'typescript',
                  content: `import '../src/index.css';\nexport const parameters = { actions: { argTypesRegex: '^on[A-Z].*' } };`,
                },
              ],
            },
            {
              path: 'src',
              name: 'src',
              size: 'Source directory',
              type: 'dir',
              children: [
                {
                  path: 'src/components',
                  name: 'components',
                  size: `${stories.length} files`,
                  type: 'dir',
                  children: stories,
                },
                {
                  path: 'src/index.css',
                  name: 'index.css',
                  size: '0.3 KB',
                  type: 'file',
                  language: 'css',
                  content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;`,
                },
              ],
            },
            {
              path: 'package.json',
              name: 'package.json',
              size: '1.4 KB',
              type: 'file',
              language: 'json',
              content: this.getPackageJsonContent(config),
            },
            {
              path: 'README.md',
              name: 'README.md',
              size: '1.5 KB',
              type: 'file',
              language: 'markdown',
              content: this.getReadmeContent(config, selectedScreens),
            },
          ],
        },
      ];
    }

    // Default: Full Project Scaffold (Vite + React + TS + Tailwind)
    const srcComponents: ExportFileItem[] = selectedScreens.map((s) => ({
      path: `src/components/${this.getComponentName(s.name)}.tsx`,
      name: `${this.getComponentName(s.name)}.tsx`,
      size: '3.8 KB',
      type: 'file',
      language: 'typescript',
      content: this.getScreenTsxContent(s.name),
    }));

    if (config.includeUnitTests) {
      selectedScreens.forEach((s) => {
        srcComponents.push({
          path: `src/components/${this.getComponentName(s.name)}.test.tsx`,
          name: `${this.getComponentName(s.name)}.test.tsx`,
          size: '1.9 KB',
          type: 'file',
          language: 'typescript',
          content: this.getUnitTestContent(s.name),
        });
      });
    }

    srcComponents.push({
      path: 'src/components/index.ts',
      name: 'index.ts',
      size: '0.5 KB',
      type: 'file',
      language: 'typescript',
      content: selectedScreens
        .map((s) => `export * from './${this.getComponentName(s.name)}';`)
        .join('\n'),
    });

    return [
      {
        path: 'project-root',
        name: `${config.projectName.toLowerCase().replace(/\s+/g, '-')}-app`,
        size: 'Root',
        type: 'dir',
        children: [
          {
            path: 'public',
            name: 'public',
            size: '1 file',
            type: 'dir',
            children: [
              {
                path: 'public/favicon.svg',
                name: 'favicon.svg',
                size: '0.6 KB',
                type: 'file',
                language: 'html',
                content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#0052cc"/><text x="50" y="58" font-size="28" fill="#fff" text-anchor="middle" font-family="sans-serif">ALSM</text></svg>`,
              },
            ],
          },
          {
            path: 'src',
            name: 'src',
            size: 'Source directory',
            type: 'dir',
            children: [
              {
                path: 'src/components',
                name: 'components',
                size: `${srcComponents.length} files`,
                type: 'dir',
                children: srcComponents,
              },
              {
                path: 'src/App.tsx',
                name: 'App.tsx',
                size: '2.1 KB',
                type: 'file',
                language: 'typescript',
                content: this.getAppTsxContent(selectedScreens),
              },
              {
                path: 'src/main.tsx',
                name: 'main.tsx',
                size: '0.4 KB',
                type: 'file',
                language: 'typescript',
                content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './index.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
              },
              {
                path: 'src/index.css',
                name: 'index.css',
                size: '0.3 KB',
                type: 'file',
                language: 'css',
                content: `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\nbody {\n  margin: 0;\n  font-family: Inter, system-ui, -apple-system, sans-serif;\n}`,
              },
            ],
          },
          {
            path: 'index.html',
            name: 'index.html',
            size: '0.5 KB',
            type: 'file',
            language: 'html',
            content: `<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${config.projectName} Modernized</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>`,
          },
          {
            path: 'package.json',
            name: 'package.json',
            size: '1.2 KB',
            type: 'file',
            language: 'json',
            content: this.getPackageJsonContent(config),
          },
          {
            path: 'tsconfig.json',
            name: 'tsconfig.json',
            size: '0.7 KB',
            type: 'file',
            language: 'json',
            content: JSON.stringify(
              {
                compilerOptions: {
                  target: 'ES2022',
                  useDefineForClassFields: true,
                  lib: ['ES2022', 'DOM', 'DOM.Iterable'],
                  module: 'ESNext',
                  skipLibCheck: true,
                  moduleResolution: 'bundler',
                  allowImportingTsExtensions: false,
                  resolveJsonModule: true,
                  isolatedModules: true,
                  noEmit: true,
                  jsx: 'react-jsx',
                  strict: config.includeTypeScriptStrict,
                  noUnusedLocals: true,
                  noUnusedParameters: true,
                  noFallthroughCasesInSwitch: true,
                },
                include: ['src'],
              },
              null,
              2
            ),
          },
          {
            path: 'vite.config.ts',
            name: 'vite.config.ts',
            size: '0.4 KB',
            type: 'file',
            language: 'typescript',
            content: `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: {\n    port: 3000,\n    open: true\n  }\n});`,
          },
          {
            path: 'tailwind.config.js',
            name: 'tailwind.config.js',
            size: '0.4 KB',
            type: 'file',
            language: 'javascript',
            content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: {\n    extend: {},\n  },\n  plugins: [],\n};`,
          },
          {
            path: 'postcss.config.js',
            name: 'postcss.config.js',
            size: '0.2 KB',
            type: 'file',
            language: 'javascript',
            content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n};`,
          },
          {
            path: 'README.md',
            name: 'README.md',
            size: '1.8 KB',
            type: 'file',
            language: 'markdown',
            content: this.getReadmeContent(config, selectedScreens),
          },
        ],
      },
    ];
  }

  /**
   * Calculates metrics for the bundle
   */
  calculateMetrics(
    config: ExportConfiguration,
    screens: LegacyScreen[]
  ): BundleMetrics {
    const selectedScreens = screens.filter((s) =>
      config.selectedScreenIds.includes(s.id)
    );
    const screensCount = selectedScreens.length;

    let totalFiles = 0;
    let estimatedSizeKb = 0;
    let totalLoc = 0;

    if (config.outputOption === 'standalone') {
      totalFiles = screensCount + 1; // + index.ts
      if (config.includeUnitTests) totalFiles += screensCount;
      if (config.includeDocumentation) totalFiles += 1;
      estimatedSizeKb = Math.round(totalFiles * 3.5 + 5);
      totalLoc = screensCount * 320;
    } else if (config.outputOption === 'storybook') {
      totalFiles = screensCount * 2 + 5; // components + stories + configs
      estimatedSizeKb = Math.round(totalFiles * 4.2 + 25);
      totalLoc = screensCount * 450;
    } else {
      // scaffold
      totalFiles = screensCount + 10;
      if (config.includeUnitTests) totalFiles += screensCount;
      estimatedSizeKb = Math.round(totalFiles * 5.5 + 120);
      totalLoc = screensCount * 380 + 220;
    }

    return {
      totalFiles,
      totalLoc,
      estimatedSizeKb,
      selectedScreensCount: screensCount,
    };
  }

  /**
   * Assembles and compresses the real ZIP bundle in the browser
   */
  async generateZipBundle(
    config: ExportConfiguration,
    screens: LegacyScreen[],
    onProgress?: (percent: number, stepLabel: string) => void
  ): Promise<Blob> {
    const zip = new JSZip();
    const tree = this.generateFileTreePreview(config, screens);

    onProgress?.(25, 'Synthesizing React components & TypeScript interfaces...');
    await new Promise((r) => setTimeout(r, 400));

    // Recursively add all files from tree into the zip root
    const addItemsToZip = (items: ExportFileItem[], currentFolder: JSZip) => {
      for (const item of items) {
        if (item.type === 'dir') {
          const subFolder = currentFolder.folder(item.name);
          if (subFolder && item.children) {
            addItemsToZip(item.children, subFolder);
          }
        } else if (item.content !== undefined) {
          currentFolder.file(item.name, item.content);
        }
      }
    };

    onProgress?.(55, 'Packaging build configuration and tooling...');
    await new Promise((r) => setTimeout(r, 400));

    if (tree[0] && tree[0].children) {
      addItemsToZip(tree[0].children, zip);
    } else {
      addItemsToZip(tree, zip);
    }

    onProgress?.(85, 'Compressing archive and optimizing assets...');
    await new Promise((r) => setTimeout(r, 400));

    const content = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 },
      },
      (metadata) => {
        const percent = Math.min(99, Math.round(85 + (metadata.percent * 0.14)));
        onProgress?.(percent, 'Finalizing zip bundle...');
      }
    );

    onProgress?.(100, 'Package generated successfully!');
    return content;
  }

  /**
   * Triggers download in user's browser
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // --- Helpers for generating file contents ---

  private getComponentName(rawName: string): string {
    return rawName
      .replace(/\.(bms|dspf)$/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^[0-9]/, 'Comp');
  }

  private getScreenTsxContent(rawName: string): string {
    const compName = this.getComponentName(rawName);
    if (rawName.toLowerCase().includes('login')) {
      return mockConversionResult.generatedCode;
    }

    return `import React, { useState } from 'react';
import { Layers, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export interface ${compName}Props {
  initialTitle?: string;
  onAction?: (action: string) => void;
}

export const ${compName}: React.FC<${compName}Props> = ({
  initialTitle = '${compName}',
  onAction,
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    onAction?.('SAVE');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden font-sans">
      {/* Header modernizer */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">{initialTitle}</h1>
            <p className="text-xs text-slate-400">Converted from Legacy BMS/DSPF</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>{isSaved ? 'Saved!' : 'Submit'}</span>
        </button>
      </div>

      {/* Modern Form Body */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Record Identifier
            </label>
            <input
              type="text"
              defaultValue="REC-8092-A"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Status Code
            </label>
            <input
              type="text"
              defaultValue="ACTIVE"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center space-x-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>Field Validation Passed</span>
          </span>
          <span>Screen LOC: 380</span>
        </div>
      </div>
    </div>
  );
};

export default ${compName};
`;
  }

  private getUnitTestContent(rawName: string): string {
    const compName = this.getComponentName(rawName);
    return `import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ${compName} } from './${compName}';

describe('${compName}', () => {
  it('renders without crashing', () => {
    render(<${compName} />);
    expect(screen.getByText('${compName}')).toBeInTheDocument();
  });

  it('triggers action on submit', () => {
    const onAction = vi.fn();
    render(<${compName} onAction={onAction} />);
    const submitBtn = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitBtn);
    expect(onAction).toHaveBeenCalledWith('SAVE');
  });
});
`;
  }

  private getStorybookContent(compName: string): string {
    return `import type { Meta, StoryObj } from '@storybook/react';
import { ${compName} } from './${compName}';

const meta: Meta<typeof ${compName}> = {
  title: 'ConvertedScreens/${compName}',
  component: ${compName},
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof ${compName}>;

export const Default: Story = {
  args: {
    initialTitle: '${compName} (Default)',
  },
};
`;
  }

  private getAppTsxContent(selectedScreens: LegacyScreen[]): string {
    const imports = selectedScreens
      .map((s) => `import { ${this.getComponentName(s.name)} } from './components/${this.getComponentName(s.name)}';`)
      .join('\n');

    const screenButtons = selectedScreens
      .map(
        (s) =>
          `<button onClick={() => setCurrent('${this.getComponentName(s.name)}')} className={\`px-3 py-1.5 rounded-lg text-xs font-semibold \${current === '${this.getComponentName(s.name)}' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}\`}>${this.getComponentName(s.name)}</button>`
      )
      .join('\n            ');

    const conditionals = selectedScreens
      .map((s) => `{current === '${this.getComponentName(s.name)}' && <${this.getComponentName(s.name)} />}`)
      .join('\n        ');

    const defaultComp = selectedScreens[0]
      ? this.getComponentName(selectedScreens[0].name)
      : 'LoginScreen';

    return `import React, { useState } from 'react';
${imports}

export const App: React.FC = () => {
  const [current, setCurrent] = useState('${defaultComp}');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <span className="font-extrabold text-blue-600 text-lg">ALSM Modernized App</span>
          <span className="text-xs bg-blue-50 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full">React + Tailwind</span>
        </div>
        <nav className="flex space-x-2">
            ${screenButtons}
        </nav>
      </header>

      <main className="flex-1 p-8 flex items-center justify-center">
        ${conditionals}
      </main>
    </div>
  );
};

export default App;
`;
  }

  private getPackageJsonContent(config: ExportConfiguration): string {
    const isReact19 = config.frameworkTarget === 'react-19';
    return JSON.stringify(
      {
        name: `${config.projectName.toLowerCase().replace(/\s+/g, '-')}-modernized`,
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc -b && vite build',
          lint: 'eslint .',
          preview: 'vite preview',
          test: config.includeUnitTests ? 'vitest run' : undefined,
          storybook: config.includeStorybook ? 'storybook dev -p 6006' : undefined,
        },
        dependencies: {
          react: isReact19 ? '^19.2.0' : '^18.3.1',
          'react-dom': isReact19 ? '^19.2.0' : '^18.3.1',
          'lucide-react': '^1.33.0',
          clsx: '^2.1.1',
          'tailwind-merge': '^3.6.0',
        },
        devDependencies: {
          '@types/react': isReact19 ? '^19.2.0' : '^18.3.3',
          '@types/react-dom': isReact19 ? '^19.2.0' : '^18.3.3',
          '@vitejs/plugin-react': '^4.3.1',
          typescript: '^5.5.3',
          vite: '^5.4.1',
          tailwindcss: '^3.4.10',
          autoprefixer: '^10.4.20',
          postcss: '^8.4.41',
          ...(config.includeUnitTests
            ? {
                vitest: '^2.0.5',
                '@testing-library/react': '^16.0.0',
                '@testing-library/jest-dom': '^6.4.8',
              }
            : {}),
        },
      },
      null,
      2
    );
  }

  private getReadmeContent(
    config: ExportConfiguration,
    selectedScreens: LegacyScreen[]
  ): string {
    return `# ${config.projectName} - Modernized Code Package

This code package was automatically generated and exported by **ALSM (Automating Legacy System Modernization Platform)**.

## Package Information
- **Export Date:** ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
- **Framework Target:** ${config.frameworkTarget === 'react-19' ? 'React 19.x' : 'React 18.2.0'}
- **Language:** TypeScript (${config.includeTypeScriptStrict ? 'Strict' : 'Standard'})
- **Styling:** Tailwind CSS
- **Included Converted Screens:** ${selectedScreens.map((s) => s.name).join(', ')}

---

## Quick Start Guide

### 1. Extract the package
Unzip the downloaded archive into your desired workspace directory.

### 2. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 3. Start development server
\`\`\`bash
npm run dev
\`\`\`
Open [http://localhost:3000](http://localhost:3000) to view your modernized React screens.

${config.includeUnitTests ? `### 4. Run automated tests\n\`\`\`bash\nnpm run test\n\`\`\`\n` : ''}
${config.includeStorybook ? `### 5. Launch Storybook\n\`\`\`bash\nnpm run storybook\n\`\`\`\n` : ''}

---
Generated with precision by **ALSM Engine**.
`;
  }
}

export const exportService = new ExportService();
