import type { DiagnosticLog } from '@/features/diagnostics/types/diagnostics';

export const mockDiagnosticsLogs: DiagnosticLog[] = [
  {
    id: 'diag-1',
    timestamp: '2026-08-25 14:32:10',
    screenName: 'LoginScreen.bms',
    errorCode: 'ERR_BMS_UNSUPPORTED_MACRO',
    severity: 'Fatal',
    lineNumber: 142,
    offendingCode: 'EXEC CICS HANDLE ABEND LABEL(ABEND-RTN)',
    offendingLineDisplay: 'Line 142',
    snippet: [
      { lineNumber: 139, code: "EXEC CICS SEND MAP('LOGIN')" },
      { lineNumber: 140, code: 'MAPONLY' },
      { lineNumber: 141, code: 'ERASE' },
      { lineNumber: 142, code: 'EXEC CICS HANDLE ABEND LABEL(ABEND-RTN)', isOffending: true },
      { lineNumber: 143, code: 'END-EXEC.' },
      { lineNumber: 144, code: '* Handle legacy authentication routing' },
      { lineNumber: 145, code: 'PERFORM AUTH-CHECK.' },
    ],
    suggestedPatch: {
      offendingLine: 'EXEC CICS HANDLE ABEND LABEL(ABEND-RTN)',
      suggestedLine: 'import { ErrorBoundary } from "react-error-boundary";',
      confidence: 'High Confidence Match',
      targetFramework: 'Suggested Patch (React)',
      reason:
        'The macro HANDLE ABEND is not supported in the React translation target. The modernization engine suggests wrapping the component boundary with a standard React Error Boundary.',
      patchSnippet: `import { ErrorBoundary } from 'react-error-boundary';
...
return (
  <ErrorBoundary FallbackComponent={AbendRtnFallback}>
    <LoginMap />
  </ErrorBoundary>
);`,
    },
    resolved: false,
    escalated: false,
    manualReview: false,
  },
  {
    id: 'diag-2',
    timestamp: '2026-08-25 14:31:05',
    screenName: 'LoginScreen.bms',
    errorCode: 'WARN_DEPRECATED_SYSCALL',
    severity: 'Warning',
    lineNumber: 89,
    offendingCode: "CALL 'SYSDAT' USING WS-SYS-DATE.",
    offendingLineDisplay: 'Line 89',
    snippet: [
      { lineNumber: 86, code: '01  WS-SYS-DATE  PIC X(8).' },
      { lineNumber: 87, code: '01  WS-SYS-TIME  PIC X(8).' },
      { lineNumber: 88, code: '* Legacy date query call' },
      { lineNumber: 89, code: "CALL 'SYSDAT' USING WS-SYS-DATE.", isOffending: true },
      { lineNumber: 90, code: 'IF WS-SYS-DATE = SPACES GO TO ERR-DATE.' },
      { lineNumber: 91, code: 'PERFORM FORMAT-DATE-DISP.' },
    ],
    suggestedPatch: {
      offendingLine: "CALL 'SYSDAT' USING WS-SYS-DATE.",
      suggestedLine: 'const currentDate = new Date().toISOString().slice(0, 10);',
      confidence: 'High Confidence Match',
      targetFramework: 'Suggested Patch (TypeScript)',
      reason:
        'SYSDAT is a deprecated system call in legacy mainframe environments. The modernization engine suggests replacing it with standard ECMAScript ISO date utilities.',
      patchSnippet: `// Modernized Date Provider
const currentDate = new Date().toISOString().slice(0, 10);
console.log('Formatted System Date:', currentDate);`,
    },
    resolved: false,
    escalated: false,
    manualReview: false,
  },
  {
    id: 'diag-3',
    timestamp: '2026-08-25 14:25:00',
    screenName: 'AccountView.bms',
    errorCode: 'WARN_LAYOUT_OVERLAP',
    severity: 'Warning',
    lineNumber: 18,
    offendingCode: 'BALANCE DFHMDF POS=(10,11), LENGTH=20, ATTRB=(UNPROT,NORM)',
    offendingLineDisplay: 'Line 18',
    snippet: [
      { lineNumber: 16, code: 'DFHMDI SIZE=(24,80), CTRL=FREEKB' },
      { lineNumber: 17, code: 'ACCTNO  DFHMDF POS=(10,1), LENGTH=12, ATTRB=(ASKIP,BRT)' },
      { lineNumber: 18, code: 'BALANCE DFHMDF POS=(10,11), LENGTH=20, ATTRB=(UNPROT,NORM)', isOffending: true },
      { lineNumber: 19, code: 'END-EXEC.' },
    ],
    suggestedPatch: {
      offendingLine: 'BALANCE DFHMDF POS=(10,11), LENGTH=20',
      suggestedLine: 'BALANCE DFHMDF POS=(10,14), LENGTH=20',
      confidence: 'Medium Confidence Match',
      targetFramework: 'Suggested Patch (BMS Layout)',
      reason:
        'Field BALANCE position (10,11) overlaps with field ACCTNO ending at column 12. Adjust starting column from 11 to 14 to avoid collision.',
      patchSnippet: `BALANCE DFHMDF POS=(10,14), LENGTH=20, ATTRB=(UNPROT,NORM)`,
    },
    resolved: false,
    escalated: false,
    manualReview: false,
  },
];
