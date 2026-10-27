import { describe, expect, it } from 'vitest';
import type { ExportFileItem, JavaExportOptions } from '../types/export';
import { buildJavaProjectTree, countTreeFiles } from './javaExportBundle';

const tasklet = `package cobolprogramclasses.model09.tasklet;

import jp.co.alsm.common.Console;
import jp.co.alsm.helper.Compare;

public class Model09Tasklet {
}`;
const model = `package cobolprogramclasses.model09.configuration;

public class Model09Model {
}`;

// The shape the backend returns: real Java under java/<package folders>.
const apiTree: ExportFileItem[] = [
  {
    path: 'export-bundle',
    name: 'export-bundle',
    size: 'Root',
    type: 'dir',
    children: [
      {
        path: 'export-bundle/java',
        name: 'java',
        size: '',
        type: 'dir',
        children: [
          { path: 'export-bundle/java/cobolprogramclasses/model09/tasklet/Model09Tasklet.java', name: 'Model09Tasklet.java', size: '1 KB', type: 'file', content: tasklet },
          { path: 'export-bundle/java/cobolprogramclasses/model09/configuration/Model09Model.java', name: 'Model09Model.java', size: '1 KB', type: 'file', content: model },
        ],
      },
    ],
  },
];

const options: JavaExportOptions = {
  format: 'spring-boot-batch',
  javaVersion: '17',
  includeJUnitTests: true,
  includeEntrypoint: true,
  includeReadme: true,
};

const paths = (items: ExportFileItem[]): string[] =>
  items.flatMap((item) => (item.type === 'dir' ? paths(item.children ?? []) : [item.path.replace('export-bundle/', '')]));

describe('buildJavaProjectTree', () => {
  it('lays the real Java out as a Maven project with build files, entrypoint, tests and README', () => {
    const tree = buildJavaProjectTree({ projectName: 'Acme Batch', options, apiTree });
    expect(paths(tree).sort()).toEqual(
      [
        'README.md',
        'pom.xml',
        'src/main/java/cobolprogramclasses/BatchApplication.java',
        'src/main/java/cobolprogramclasses/model09/configuration/Model09Model.java',
        'src/main/java/cobolprogramclasses/model09/tasklet/Model09Tasklet.java',
        'src/main/resources/application.yml',
        'src/test/java/cobolprogramclasses/model09/tasklet/Model09TaskletTest.java',
      ].sort(),
    );
    expect(tree[0].name).toBe('export-bundle');
  });

  it('keeps the generated Java byte for byte and writes the chosen Java version into the pom', () => {
    const find = (items: ExportFileItem[], name: string): ExportFileItem | undefined =>
      items.flatMap((i) => (i.type === 'dir' ? [find(i.children ?? [], name)] : i.name === name ? [i] : [])).find(Boolean);
    const tree = buildJavaProjectTree({ projectName: 'Acme Batch', options: { ...options, javaVersion: '21' }, apiTree });
    expect(find(tree, 'Model09Tasklet.java')?.content).toBe(tasklet);
    const pom = find(tree, 'pom.xml')?.content ?? '';
    expect(pom).toContain('<java.version>21</java.version>');
    expect(pom).toContain('spring-boot-starter-batch');
    expect(pom).toContain('<version>3.3.5</version>');
  });

  it('honours the checkboxes and tells the user which shared runtime classes are missing', () => {
    const tree = buildJavaProjectTree({
      projectName: 'Acme',
      options: { ...options, includeJUnitTests: false, includeEntrypoint: false, includeReadme: true },
      apiTree,
    });
    const all = paths(tree);
    expect(all.some((p) => p.endsWith('Test.java'))).toBe(false);
    expect(all).not.toContain('src/main/java/cobolprogramclasses/BatchApplication.java');
    const readme = (tree[0].children ?? []).find((c) => c.name === 'README.md')?.content ?? '';
    expect(readme).toContain('mvn clean compile');
    expect(readme).toContain('jp.co.alsm.common.Console');
  });

  it('exports only the .java files in their package folders for the standalone format', () => {
    const tree = buildJavaProjectTree({ projectName: 'Acme', options: { ...options, format: 'java-sources' }, apiTree });
    expect(paths(tree).sort()).toEqual([
      'cobolprogramclasses/model09/configuration/Model09Model.java',
      'cobolprogramclasses/model09/tasklet/Model09Tasklet.java',
    ]);
    expect(countTreeFiles(tree)).toBe(2);
  });
});
