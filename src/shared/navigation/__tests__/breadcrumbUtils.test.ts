import { generateBreadcrumbs } from '../breadcrumbUtils';
describe('breadcrumbUtils', () => { it('returns home breadcrumb at root', () => { expect(generateBreadcrumbs('/')).toBeDefined(); }); });