const projectNamesMap: Record<string, string> = {
  'proj-acme': 'Acme Corp Modernization',
  'proj-core-banking': 'Core Banking System',
  'proj-insurance': 'Insurance Policy System',
};

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
