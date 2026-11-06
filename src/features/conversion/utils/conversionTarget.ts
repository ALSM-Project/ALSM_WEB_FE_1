import type { LegacyScreen } from '@/features/screens/types/screen';

const PROGRAM_SOURCE_TYPES = new Set(['COBOL', 'RPG']);

// What the export builds for a converted program: Spring Boot 2.7 / Spring Batch 4, compiled for
// Java 8 and run on any JDK up to 21.
const JAVA_TARGET = 'Java 8–21 (Spring Boot 2.7 / Spring Batch 4)';
const JAVA_ENGINE = 'AKAMIG Batch Modernization Engine';
const REACT_TARGET = 'React 19 + TypeScript';
const REACT_ENGINE = 'ALSM Synthesis Pipeline';

/**
 * What the selected files are converted to, and by which engine: COBOL/RPG programs to a Spring
 * Batch application, BMS/DSPF screens to React. With nothing selected the project's own kind
 * decides.
 */
export function conversionTargetFor(
  selected: LegacyScreen[],
  projectIsCobol: boolean,
): { framework: string; engine: string } {
  const hasPrograms = selected.some((s) => PROGRAM_SOURCE_TYPES.has(s.sourceType));
  const hasScreens = selected.some((s) => !PROGRAM_SOURCE_TYPES.has(s.sourceType));
  if (hasPrograms && hasScreens) {
    return { framework: `${JAVA_TARGET} + ${REACT_TARGET}`, engine: `${JAVA_ENGINE} + ${REACT_ENGINE}` };
  }
  if (hasPrograms || (!hasScreens && projectIsCobol)) return { framework: JAVA_TARGET, engine: JAVA_ENGINE };
  return { framework: REACT_TARGET, engine: REACT_ENGINE };
}
