import type { DiagnosticLog } from '@/features/diagnostics/types/diagnostics';

export const mockDiagnosticsLogs: DiagnosticLog[] = [
  {
    id: 'diag-1',
    timestamp: 'Oct 12, 10:45:22',
    screenName: 'LoginScreen.bms',
    errorCode: 'ERR_BMS_UNSUPPORTED_MACRO',
    severity: 'Fatal',
    lineNumber: 42,
    offendingCode: 'DFHMDI SIZE=(24,80), CTRL=(FREEKB,FRSET), @CUSTOM_MACRO_X',
    suggestedPatch: {
      offendingLine: 'DFHMDI SIZE=(24,80), CTRL=(FREEKB,FRSET), @CUSTOM_MACRO_X',
      suggestedLine: 'DFHMDI SIZE=(24,80), CTRL=(FREEKB,FRSET)',
      reason: 'Custom macro @CUSTOM_MACRO_X is not standard BMS syntax and unsupported by parser.',
    },
    resolved: false,
  },
  {
    id: 'diag-2',
    timestamp: 'Oct 12, 10:42:15',
    screenName: 'AccountView.bms',
    errorCode: 'WARN_LAYOUT_OVERLAP',
    severity: 'Warning',
    lineNumber: 18,
    offendingCode: 'DFHMDF POS=(10,15), LENGTH=30, ATTRB=(UNPROT,NORM)',
    suggestedPatch: {
      offendingLine: 'DFHMDF POS=(10,15), LENGTH=30',
      suggestedLine: 'DFHMDF POS=(10,15), LENGTH=20',
      reason: 'Field length exceeds screen bounds at row 10, column 15.',
    },
    resolved: false,
  },
  {
    id: 'diag-3',
    timestamp: 'Oct 12, 10:30:01',
    screenName: 'TransferForm.bms',
    errorCode: 'ERR_INVALID_FIELD_TYPE',
    severity: 'Fatal',
    lineNumber: 29,
    offendingCode: 'DFHMDF POS=(14,20), ATTRB=(RAW_BINARY)',
    suggestedPatch: {
      offendingLine: 'ATTRB=(RAW_BINARY)',
      suggestedLine: 'ATTRB=(NUM,PROT)',
      reason: 'Unsupported field attribute RAW_BINARY replaced with numeric protected field.',
    },
    resolved: false,
  },
];
