import type { ExportFileItem, JavaExportOptions } from '../types/export';

/**
 * Lays the real Java the converter generated out as the package a developer receives:
 * a Spring Boot Batch Maven project, or just the `.java` files with their package folders.
 * The Java files themselves are never altered or invented - only the build files around them
 * (pom.xml, application.yml, entrypoint, tests, README) are written here.
 */

const PACKAGE_ROOT = 'cobolprogramclasses';
const ROOT_NAME = 'export-bundle';
const SPRING_BOOT_VERSION = '3.3.5';
const RUNTIME_PREFIXES = ['jp.co.alsm.', 'com.alsm.runtime.'];

interface FlatFile {
  path: string;
  content: string;
  language: NonNullable<ExportFileItem['language']>;
}

function sizeOf(content: string): string {
  return `${(new TextEncoder().encode(content).length / 1024).toFixed(1)} KB`;
}

function flattenJavaFiles(items: ExportFileItem[], into: FlatFile[] = []): FlatFile[] {
  for (const item of items) {
    if (item.type === 'dir') flattenJavaFiles(item.children ?? [], into);
    else if (item.name.endsWith('.java') && item.content !== undefined) {
      into.push({ path: item.path, content: item.content, language: 'java' });
    }
  }
  return into;
}

/** Path of a generated Java file relative to the source root (`cobolprogramclasses/...`). */
function sourceRelativePath(path: string): string {
  const parts = path.split('/').filter(Boolean);
  const start = parts.indexOf(PACKAGE_ROOT);
  return start >= 0 ? parts.slice(start).join('/') : parts.slice(-2).join('/');
}

function packageAndClass(content: string, fallbackName: string): { pkg: string; cls: string } {
  const pkg = /^\s*package\s+([\w.]+)\s*;/m.exec(content)?.[1] ?? PACKAGE_ROOT;
  const cls = /\b(?:class|interface|enum)\s+(\w+)/.exec(content)?.[1] ?? fallbackName.replace(/\.java$/, '');
  return { pkg, cls };
}

function pomXml(options: JavaExportOptions, projectName: string): string {
  const artifact = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'alsm-batch';
  const test = options.includeJUnitTests
    ? `
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>`
    : '';
  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>
  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>${SPRING_BOOT_VERSION}</version>
    <relativePath/>
  </parent>
  <groupId>com.alsm.converted</groupId>
  <artifactId>${artifact}</artifactId>
  <version>1.0.0</version>
  <name>${projectName}</name>
  <properties>
    <java.version>${options.javaVersion}</java.version>
  </properties>
  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-batch</artifactId>
    </dependency>
    <dependency>
      <groupId>com.h2database</groupId>
      <artifactId>h2</artifactId>
      <scope>runtime</scope>
    </dependency>
    <dependency>
      <groupId>org.projectlombok</groupId>
      <artifactId>lombok</artifactId>
      <optional>true</optional>
    </dependency>${test}
  </dependencies>
  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>
`;
}

const APPLICATION_YML = `spring:
  application:
    name: converted-batch
  datasource:
    url: jdbc:h2:mem:batch;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
  batch:
    job:
      enabled: false
    jdbc:
      initialize-schema: embedded
`;

const ENTRYPOINT = `package ${PACKAGE_ROOT};

import org.springframework.batch.core.Job;
import org.springframework.batch.core.JobParametersBuilder;
import org.springframework.batch.core.launch.JobLauncher;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;

/** Starts the Spring context and, when a job name is given as the first argument, runs that job. */
@SpringBootApplication
public class BatchApplication implements CommandLineRunner {

    @Autowired
    private JobLauncher jobLauncher;

    @Autowired
    private ApplicationContext context;

    public static void main(String[] args) {
        SpringApplication.run(BatchApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        if (args.length == 0) {
            return;
        }
        Job job = context.getBean(args[0], Job.class);
        jobLauncher.run(job, new JobParametersBuilder().addLong("run.id", System.currentTimeMillis()).toJobParameters());
    }
}
`;

function taskletTest(pkg: string, cls: string): string {
  return `package ${pkg};

import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

class ${cls}Test {

    @Test
    void taskletClassIsOnTheClasspath() throws ClassNotFoundException {
        assertNotNull(Class.forName("${pkg}.${cls}"));
    }
}
`;
}

/** Imports of the converter's shared runtime that the bundle does not contain itself. */
function missingRuntimeImports(files: FlatFile[]): string[] {
  const provided = new Set(
    files.map((file) => {
      const { pkg, cls } = packageAndClass(file.content, file.path.split('/').pop() ?? '');
      return `${pkg}.${cls}`;
    }),
  );
  const missing = new Set<string>();
  for (const file of files) {
    for (const match of file.content.matchAll(/^\s*import\s+(?:static\s+)?([\w.]+)\s*;/gm)) {
      const name = match[1];
      if (RUNTIME_PREFIXES.some((prefix) => name.startsWith(prefix)) && !provided.has(name)) missing.add(name);
    }
  }
  return [...missing].sort();
}

function readme(options: JavaExportOptions, projectName: string, files: FlatFile[], hasEntrypoint: boolean): string {
  const programs = files.filter((f) => f.path.endsWith('Tasklet.java')).map((f) => f.path.split('/').pop());
  const missing = missingRuntimeImports(files);
  return `# ${projectName} - converted COBOL batch programs

Spring Boot ${SPRING_BOOT_VERSION} / Spring Batch project, Java ${options.javaVersion}, built with Apache Maven 3.9+.

## Build

\`\`\`bash
mvn clean compile
\`\`\`
${
  hasEntrypoint
    ? `
## Run a job

\`\`\`bash
mvn spring-boot:run -Dspring-boot.run.arguments=<jobBeanName>
\`\`\`
`
    : ''
}
## Converted programs

${programs.length > 0 ? programs.map((name) => `- ${name}`).join('\n') : '- (no Tasklet classes in this export)'}
${
  missing.length > 0
    ? `
## Shared runtime required

The generated code imports classes from the converter's shared runtime library, which is not part of this bundle. Add it to the classpath before compiling:

${missing.map((name) => `- \`${name}\``).join('\n')}
`
    : ''
}`;
}

function build(files: { path: string; content: string; language: NonNullable<ExportFileItem['language']> }[]): ExportFileItem[] {
  const root: ExportFileItem = { path: ROOT_NAME, name: ROOT_NAME, size: 'Root', type: 'dir', children: [] };
  for (const file of files) {
    const parts = file.path.split('/');
    let dir = root;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const dirPath = `${ROOT_NAME}/${parts.slice(0, i + 1).join('/')}`;
      let next = dir.children!.find((child) => child.type === 'dir' && child.path === dirPath);
      if (!next) {
        next = { path: dirPath, name: parts[i], size: '', type: 'dir', children: [] };
        dir.children!.push(next);
      }
      dir = next;
    }
    dir.children!.push({
      path: `${ROOT_NAME}/${file.path}`,
      name: parts[parts.length - 1],
      size: sizeOf(file.content),
      type: 'file',
      language: file.language,
      content: file.content,
    });
  }
  const finish = (item: ExportFileItem) => {
    if (item.type !== 'dir') return;
    item.children!.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'dir' ? -1 : 1));
    if (item !== root) item.size = `${countFiles(item)} files`;
    item.children!.forEach(finish);
  };
  finish(root);
  return [root];
}

function countFiles(item: ExportFileItem): number {
  return item.type === 'file' ? 1 : (item.children ?? []).reduce((sum, child) => sum + countFiles(child), 0);
}

export function buildJavaProjectTree(input: {
  projectName: string;
  options: JavaExportOptions;
  /** The file tree the backend returned for the selected programs. */
  apiTree: ExportFileItem[];
}): ExportFileItem[] {
  const { projectName, options } = input;
  const javaFiles = flattenJavaFiles(input.apiTree).map((file) => ({
    ...file,
    path: sourceRelativePath(file.path),
  }));

  if (options.format === 'java-sources') return build(javaFiles);

  const files: FlatFile[] = javaFiles.map((file) => ({ ...file, path: `src/main/java/${file.path}` }));
  files.push({ path: 'pom.xml', content: pomXml(options, projectName), language: 'xml' });
  files.push({ path: 'src/main/resources/application.yml', content: APPLICATION_YML, language: 'yaml' });
  if (options.includeEntrypoint) {
    files.push({
      path: `src/main/java/${PACKAGE_ROOT}/BatchApplication.java`,
      content: ENTRYPOINT,
      language: 'java',
    });
  }
  if (options.includeJUnitTests) {
    for (const file of javaFiles.filter((f) => f.path.endsWith('Tasklet.java'))) {
      const { pkg, cls } = packageAndClass(file.content, file.path.split('/').pop() ?? '');
      files.push({
        path: `src/test/java/${pkg.replace(/\./g, '/')}/${cls}Test.java`,
        content: taskletTest(pkg, cls),
        language: 'java',
      });
    }
  }
  if (options.includeReadme) {
    files.push({ path: 'README.md', content: readme(options, projectName, javaFiles, options.includeEntrypoint), language: 'markdown' });
  }
  return build(files);
}

export function countTreeFiles(tree: ExportFileItem[]): number {
  return tree.reduce((sum, item) => sum + countFiles(item), 0);
}

export function countTreeLines(tree: ExportFileItem[]): number {
  const lines = (item: ExportFileItem): number =>
    item.type === 'file' ? (item.content ?? '').split('\n').length : (item.children ?? []).reduce((s, c) => s + lines(c), 0);
  return tree.reduce((sum, item) => sum + lines(item), 0);
}
