const projectNamesMap: Record<string, string> = {
  'proj-acme': 'Acme Corp Modernization',
  'proj-core-banking': 'Core Banking System',
  'proj-insurance': 'Insurance Policy System',
};

const projectConversionTypesMap: Record<string, string> = {};

export function cacheProjectConversionType(id: string, type: string): void {
  if (!id || !type) return;
  projectConversionTypesMap[id] = type;
  try {
    const cached = JSON.parse(sessionStorage.getItem('alsm_project_types_cache') || '{}');
    cached[id] = type;
    sessionStorage.setItem('alsm_project_types_cache', JSON.stringify(cached));
  } catch {
    // Ignore storage quota errors
  }
}

export function getCachedProjectConversionType(id: string): string | undefined {
  if (!id) return undefined;
  if (projectConversionTypesMap[id]) return projectConversionTypesMap[id];

  try {
    const cached = JSON.parse(sessionStorage.getItem('alsm_project_types_cache') || '{}');
    if (cached[id]) {
      projectConversionTypesMap[id] = cached[id];
      return cached[id];
    }
  } catch {
    // Ignore storage parse errors
  }

  return undefined;
}

export function cacheProjectName(id: string, name: string): void {
  if (!id || !name) return;
  projectNamesMap[id] = name;
  try {
    const cached = JSON.parse(localStorage.getItem('alsm_project_names_cache') || '{}');
    cached[id] = name;
    localStorage.setItem('alsm_project_names_cache', JSON.stringify(cached));
  } catch {
    // Ignore storage quota errors
  }
}

export function getProjectName(id: string): string {
  if (!id) return 'Project Workspace';
  if (projectNamesMap[id]) return projectNamesMap[id];

  try {
    const cached = JSON.parse(localStorage.getItem('alsm_project_names_cache') || '{}');
    if (cached[id]) {
      projectNamesMap[id] = cached[id];
      return cached[id];
    }
  } catch {
    // Ignore storage parse errors
  }

  // Formatting fallback for un-cached IDs
  if (id.startsWith('proj-')) {
    const rawName = id.replace(/^proj-/, '').replace(/[-_]/g, ' ');
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
  }

  return id;
}

export function isCobolProjectSync(projectId?: string, conversionType?: string): boolean {
  if (conversionType) {
    if (conversionType === 'COBOL_TO_JAVA' || conversionType === 'PROGRAMS') return true;
  }
  if (!projectId) return false;
  const cached = getCachedProjectConversionType(projectId);
  if (cached === 'COBOL_TO_JAVA' || cached === 'PROGRAMS') return true;
  const name = getProjectName(projectId);
  if (name && /cobol/i.test(name)) return true;
  return false;
}
