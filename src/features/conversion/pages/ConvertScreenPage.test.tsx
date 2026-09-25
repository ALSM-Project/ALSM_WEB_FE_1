import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { LegacyScreen } from '@/features/screens/types/screen';
import type { ConversionJob } from '../services/conversion.service';
import type { ConversionResultBundle, FieldMapping } from '../types/conversion';
import { ConvertScreenPage } from './ConvertScreenPage';

// UC-98: the Field Mapping tab must never show fabricated example rows (previously
// hardcoded USER-ID-INPUT/PASS-KEY-ATTR regardless of the real screen). Mock
// conversionService directly, matching the convention used elsewhere in this codebase.
const mocks = vi.hoisted(() => ({
  getScreenById: vi.fn(),
  getLatestConversion: vi.fn(),
  getConversionResult: vi.fn(),
  getFieldMappings: vi.fn(),
  createConversion: vi.fn(),
}));

vi.mock('../services/conversion.service', () => ({
  conversionService: {
    getScreenById: mocks.getScreenById,
    getLatestConversion: mocks.getLatestConversion,
    getConversionResult: mocks.getConversionResult,
    getFieldMappings: mocks.getFieldMappings,
    createConversion: mocks.createConversion,
  },
}));

const screen1: LegacyScreen = {
  id: 'scr-1',
  projectId: 'proj-acme',
  name: 'LOGIN.bms',
  sourceType: 'BMS',
  status: 'Completed',
  framework: 'React',
  lastUpdated: 'just now',
};

const completedJob: ConversionJob = {
  id: 'job-1',
  status: 'COMPLETED',
  resultReference: 'results/proj-acme/job-1',
  createdAt: '2026-09-25T00:00:00.000Z',
  startedAt: '2026-09-25T00:00:00.000Z',
  completedAt: '2026-09-25T00:00:05.000Z',
};

const realTsx = `
export function LoginScreen() {
  const [state, setState] = useState({ ACCOUNT_ID: '', ACCT_STATUS: '' });
  return (
    <form>
      <input name="ACCOUNT_ID" type="text" />
      <input name="ACCT_STATUS" type="password" />
    </form>
  );
}
`;

const resultBundle: ConversionResultBundle = {
  conversionJobId: 'job-1',
  files: [{ relativePath: 'LoginScreen.tsx', content: realTsx }],
};

const savedMapping: FieldMapping = {
  id: 'map-1',
  legacyField: { name: 'ACCOUNT-ID', type: 'CHAR', length: 10, position: 'R10 C15' },
  componentMapping: {
    componentType: 'TextField',
    labelText: 'Account ID',
    isRequired: true,
    minLength: 1,
    maxLength: 10,
    regexPattern: '',
  },
};

describe('ConvertScreenPage - Field Mapping tab (UC-98)', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-1/convert']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/convert" element={<ConvertScreenPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  const openMappingTab = async () => {
    const tab = await screen.findByText('Field Mapping');
    fireEvent.click(tab);
  };

  it('never shows the old fabricated example rows (USER-ID-INPUT / PASS-KEY-ATTR)', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(completedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);
    mocks.getFieldMappings.mockResolvedValue([]);

    renderPage();
    await openMappingTab();

    expect(screen.queryByText(/USER-ID-INPUT/)).not.toBeInTheDocument();
    expect(screen.queryByText(/PASS-KEY-ATTR/)).not.toBeInTheDocument();
  });

  it('shows real saved field mappings when they exist', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(completedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);
    mocks.getFieldMappings.mockResolvedValue([savedMapping]);

    renderPage();
    await openMappingTab();

    expect(await screen.findByText(/ACCOUNT-ID/)).toBeInTheDocument();
    expect(screen.getByText(/Account ID/)).toBeInTheDocument();
    expect(screen.getByText('Saved Field Mappings')).toBeInTheDocument();
  });

  it('falls back to real fields auto-detected from the generated code when nothing is saved yet', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(completedJob);
    mocks.getConversionResult.mockResolvedValue(resultBundle);
    mocks.getFieldMappings.mockResolvedValue([]);

    renderPage();
    await openMappingTab();

    expect(await screen.findByText('ACCOUNT_ID')).toBeInTheDocument();
    expect(screen.getByText('ACCT_STATUS')).toBeInTheDocument();
    expect(screen.getByText('Auto-Detected Field Mappings')).toBeInTheDocument();
    expect(screen.getByText(/No mapping has been saved/i)).toBeInTheDocument();
  });

  it('shows an honest message instead of any data before the screen has been converted', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(null);
    mocks.getFieldMappings.mockResolvedValue([]);

    renderPage();
    await openMappingTab();

    expect(await screen.findByText(/Run the converter first/i)).toBeInTheDocument();
  });
});

// Regression test: a real backend failure when starting a conversion (e.g. the queue is
// unavailable) used to be completely silent on this page — no error, no change, nothing.
// It looked identical to the button just not doing anything.
describe('ConvertScreenPage - conversion start errors', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-1/convert']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/convert" element={<ConvertScreenPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  it('shows a real error banner when starting the conversion fails', async () => {
    mocks.getScreenById.mockResolvedValue(screen1);
    mocks.getLatestConversion.mockResolvedValue(null);
    mocks.getFieldMappings.mockResolvedValue([]);
    mocks.createConversion.mockRejectedValue(new Error('Conversion job could not be queued'));

    renderPage();
    const runButton = await screen.findByRole('button', { name: /Run Conversion Algorithm Now/i });
    fireEvent.click(runButton);

    expect(await screen.findByText('Conversion job could not be queued')).toBeInTheDocument();
    expect(screen.getByText('Could not start the conversion.')).toBeInTheDocument();
  });
});

// UC-28: a COBOL screen must never show the BMS field-mapping UI (which has no
// relationship to, and no effect on, COBOL->Java output) - it must route to Method Mapping
// instead, and must never call the BMS field-mapping endpoint at all.
describe('ConvertScreenPage - COBOL screens route to Method Mapping, not Field Mapping (UC-28)', () => {
  const renderPage = () =>
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-cobol/convert']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/convert" element={<ConvertScreenPage />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

  const cobolScreen: LegacyScreen = {
    id: 'scr-cobol',
    projectId: 'proj-acme',
    name: 'CBACT01C.cbl',
    sourceType: 'COBOL',
    status: 'Completed',
    framework: 'Java',
    lastUpdated: 'just now',
  };

  it('shows a Method Mapping tab, not Field Mapping, for a COBOL screen', async () => {
    mocks.getScreenById.mockResolvedValue(cobolScreen);
    mocks.getLatestConversion.mockResolvedValue(null);

    renderPage();

    expect(await screen.findByText('Method Mapping')).toBeInTheDocument();
    expect(screen.queryByText('Field Mapping')).not.toBeInTheDocument();
  });

  it('never calls the BMS field-mapping endpoint for a COBOL screen', async () => {
    // This test file has no global mock-clearing between tests, so isolate against calls
    // made by earlier (BMS) tests in this same file rather than asserting a global zero.
    mocks.getFieldMappings.mockClear();
    mocks.getScreenById.mockResolvedValue(cobolScreen);
    mocks.getLatestConversion.mockResolvedValue(null);

    renderPage();
    await screen.findByText('Method Mapping');

    expect(mocks.getFieldMappings).not.toHaveBeenCalled();
  });

  it('navigates to the method-mapping route, not the BMS mapping route, on "Edit Method Mapping"', async () => {
    mocks.getScreenById.mockResolvedValue(cobolScreen);
    mocks.getLatestConversion.mockResolvedValue(null);

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <MemoryRouter initialEntries={['/projects/proj-acme/screens/scr-cobol/convert']}>
          <Routes>
            <Route path="/projects/:projectId/screens/:screenId/convert" element={<ConvertScreenPage />} />
            <Route path="/projects/:projectId/screens/:screenId/method-mapping" element={<div>METHOD_MAPPING_PAGE</div>} />
            <Route path="/projects/:projectId/screens/:screenId/mapping" element={<div>BMS_MAPPING_PAGE</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );

    const editButtons = await screen.findAllByRole('button', { name: /Edit Method Mapping/i });
    fireEvent.click(editButtons[0]);

    expect(await screen.findByText('METHOD_MAPPING_PAGE')).toBeInTheDocument();
    expect(screen.queryByText('BMS_MAPPING_PAGE')).not.toBeInTheDocument();
  });
});
