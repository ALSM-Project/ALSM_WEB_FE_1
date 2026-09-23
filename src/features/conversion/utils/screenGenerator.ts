export interface ScreenField {
  name: string;
  label: string;
  defaultValue: string;
  type?: 'text' | 'select' | 'password' | 'number';
  options?: string[];
  fullWidth?: boolean;
}

export interface GeneratedScreenBundle {
  title: string;
  subtitle: string;
  fields: ScreenField[];
  files: { relativePath: string; language: string; content: string }[];
  linesOfCode: number;
}

/**
 * Returns a minimal screen bundle structure without any hardcoded mock form fields.
 */
export function generateScreenBundle(screenName: string): GeneratedScreenBundle {
  const cleanName = screenName.replace(/\.(bms|dspf|cob|cbl|dds)$/i, '');
  const upper = cleanName.toUpperCase();

  return {
    title: `Screen: ${upper}`,
    subtitle: `Modernized React Component (${screenName})`,
    fields: [],
    files: [],
    linesOfCode: 0,
  };
}

/**
 * Parses converted React TSX source code strictly to extract
 * form fields, inputs, labels, and selects directly from the generated React component.
 */
export function parseConvertedTsx(tsxCode: string, fallbackName = 'Screen'): GeneratedScreenBundle {
  if (!tsxCode || typeof tsxCode !== 'string' || tsxCode.trim().length === 0) {
    return generateScreenBundle(fallbackName);
  }

  // 1. Title
  const titleMatch = tsxCode.match(/<title[^>]*>(.*?)<\/title>/i) || tsxCode.match(/<h2[^>]*>(.*?)<\/h2>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `Screen: ${fallbackName}`;
  const subtitle = `Modernized React Component (${fallbackName})`;

  const fields: ScreenField[] = [];
  const addedFieldNames = new Set<string>();

  // 2. Extract default values & state keys from ALL useState(...) calls in the TSX file
  const defaultValues: Record<string, string> = {};
  const allUseStateMatches = Array.from(tsxCode.matchAll(/useState\s*(?:<[^>]+>)?\s*\(\s*\{([\s\S]*?)\}\s*\)/g));
  for (const match of allUseStateMatches) {
    const stateBody = match[1];
    const kvMatches = stateBody.matchAll(/([a-zA-Z0-9_]+)\s*:\s*['"]([^'"]*)['"]/g);
    for (const kv of kvMatches) {
      const keyName = kv[1].toUpperCase();
      if (!defaultValues[keyName]) {
        defaultValues[keyName] = kv[2];
      }
    }
  }

  // 3. Extract field definitions from bms2react/dspf2react TypeScript types (e.g. formInput, formOutput)
  const typeMatches = Array.from(tsxCode.matchAll(/(?:type|interface)\s+([a-zA-Z0-9_]+)\s*=?\s*\{([\s\S]*?)\}/g));
  for (const tMatch of typeMatches) {
    const typeBody = tMatch[2];
    const propertyMatches = Array.from(typeBody.matchAll(/([a-zA-Z0-9_]+)\s*\??\s*:\s*([a-zA-Z0-9_\[\]|'"]+)/g));
    for (const prop of propertyMatches) {
      const propName = prop[1].toUpperCase();
      const propType = prop[2].toLowerCase();
      if (!addedFieldNames.has(propName) && propName !== 'CHILDREN' && propName !== 'CLASSNAME') {
        addedFieldNames.add(propName);
        fields.push({
          name: propName,
          label: propName,
          defaultValue: defaultValues[propName] || '',
          type: propType.includes('number') ? 'number' : 'text',
        });
      }
    }
  }

  // 4. Parse <Input ... />, <input ... />, <select ... />, <textarea ... /> tags
  const allInputMatches = Array.from(tsxCode.matchAll(/<(?:Input|input|select|textarea)\s+([^>]+)\/?>/gi));
  for (const match of allInputMatches) {
    const props = match[1];
    const nameMatch = props.match(/name=['"]([^'"]+)['"]/i) || props.match(/id=['"]([^'"]+)['"]/i);
    const typeMatch = props.match(/type=['"]([^'"]+)['"]/i);
    const defaultValueMatch = props.match(/defaultValue=['"{]+'?([^'"{}]+)'?['"}\s]/i)
      || props.match(/defaultValue="([^"]+)"/i);
    if (nameMatch) {
      const fieldName = nameMatch[1].toUpperCase();
      if (!addedFieldNames.has(fieldName)) {
        addedFieldNames.add(fieldName);
        const fieldType = typeMatch && (typeMatch[1] === 'number' || typeMatch[1] === 'password') ? (typeMatch[1] as any) : 'text';
        fields.push({
          name: fieldName,
          label: fieldName,
          defaultValue: defaultValueMatch ? defaultValueMatch[1] : (defaultValues[fieldName] || ''),
          type: fieldType,
        });
      }
    }
  }

  // 5. Parse <label> tags to enrich field labels
  const labelTagMatches = Array.from(tsxCode.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi));
  for (const match of labelTagMatches) {
    const labelContent = match[1].replace(/[{}]/g, '').trim();
    if (
      labelContent &&
      !labelContent.includes('receivedData') &&
      labelContent.length > 1 &&
      labelContent.length < 100
    ) {
      const cleanLabel = labelContent.replace(/[:\s]/g, '').toUpperCase();
      const existingField = fields.find((f) => f.name === cleanLabel || cleanLabel.includes(f.name) || f.name.includes(cleanLabel));
      if (existingField) {
        existingField.label = labelContent;
      } else if (!addedFieldNames.has(cleanLabel)) {
        addedFieldNames.add(cleanLabel);
        fields.push({
          name: cleanLabel,
          label: labelContent,
          defaultValue: defaultValues[cleanLabel] || '',
          type: 'text',
        });
      }
    }
  }

  // 6. Fallback if useState defined fields that weren't captured by inputs/types
  for (const [key, val] of Object.entries(defaultValues)) {
    if (!addedFieldNames.has(key)) {
      addedFieldNames.add(key);
      fields.push({
        name: key,
        label: key,
        defaultValue: val,
        type: 'text',
      });
    }
  }

  return {
    title,
    subtitle,
    fields,
    files: [],
    linesOfCode: tsxCode.split('\n').length,
  };
}


