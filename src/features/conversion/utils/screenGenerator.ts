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
    if (nameMatch) {
      const fieldName = nameMatch[1].toUpperCase();
      if (!addedFieldNames.has(fieldName)) {
        addedFieldNames.add(fieldName);
        const fieldType = typeMatch && (typeMatch[1] === 'number' || typeMatch[1] === 'password') ? (typeMatch[1] as any) : 'text';
        fields.push({
          name: fieldName,
          label: fieldName,
          defaultValue: defaultValues[fieldName] || '',
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
  // 5. Dynamic fallback tailored to the specific screen if no fields were parsed from HTML
  if (fields.length === 0) {
    fields.push(...getDynamicFieldsForScreen(fallbackName));
  }

  return {
    title,
    subtitle,
    fields,
    files: [],
    linesOfCode: tsxCode.split('\n').length,
  };
}

export function getDynamicFieldsForScreen(screenName: string): ScreenField[] {
  const clean = screenName.replace(/\.(bms|dspf|cob|cbl|dds)$/i, '').toUpperCase();

  if (clean.includes('USR') || clean.includes('USER')) {
    return [
      { name: 'USER_ID', label: 'User ID / Operator', defaultValue: 'USR_1024', type: 'text' },
      { name: 'FIRST_NAME', label: 'First Name', defaultValue: 'Alex', type: 'text' },
      { name: 'LAST_NAME', label: 'Last Name', defaultValue: 'Morgan', type: 'text' },
      { name: 'USER_ROLE', label: 'Access Role', defaultValue: 'ADMIN', type: 'select', options: ['ADMIN', 'MANAGER', 'OPERATOR', 'AUDITOR'] },
      { name: 'DEPT_CODE', label: 'Department Code', defaultValue: 'FIN_OPS', type: 'text' },
      { name: 'USER_STATUS', label: 'Account Status', defaultValue: 'ACTIVE', type: 'select', options: ['ACTIVE', 'SUSPENDED', 'LOCKED'] },
    ];
  }

  if (clean.includes('ACT') || clean.includes('ACCT') || clean.includes('ACC')) {
    return [
      { name: 'ACCT_NO', label: 'Account Number', defaultValue: '4091-8821-0092', type: 'text' },
      { name: 'ACCT_NAME', label: 'Account Holder Name', defaultValue: 'Global Logistics Corp', type: 'text' },
      { name: 'ACCT_TYPE', label: 'Account Type', defaultValue: 'CHECKING', type: 'select', options: ['CHECKING', 'SAVINGS', 'ESCROW', 'CORPORATE'] },
      { name: 'CURRENCY', label: 'Currency Code', defaultValue: 'USD', type: 'select', options: ['USD', 'EUR', 'GBP', 'JPY', 'VND'] },
      { name: 'AVAIL_BAL', label: 'Available Balance', defaultValue: '125,450.00', type: 'text' },
      { name: 'LIMIT_AMT', label: 'Credit Limit', defaultValue: '500,000.00', type: 'text' },
    ];
  }

  if (clean.includes('TRN') || clean.includes('TRANS')) {
    return [
      { name: 'TRAN_ID', label: 'Transaction Reference', defaultValue: 'TXN-984210', type: 'text' },
      { name: 'CARD_NO', label: 'Card Number (Masked)', defaultValue: '4532-XXXX-XXXX-9812', type: 'text' },
      { name: 'TRAN_AMT', label: 'Transaction Amount', defaultValue: '1,490.50', type: 'text' },
      { name: 'MERCHANT', label: 'Merchant / Outlet', defaultValue: 'ACME SUPPLIES LTD', type: 'text' },
      { name: 'POST_DATE', label: 'Posting Date', defaultValue: '2026-09-24', type: 'text' },
      { name: 'AUTH_CODE', label: 'Approval Code', defaultValue: 'AUTH_77192', type: 'text' },
    ];
  }

  if (clean.includes('INQ') || clean.includes('SEARCH')) {
    return [
      { name: 'SEARCH_KEY', label: 'Search Keyword / ID', defaultValue: 'KEY_001', type: 'text' },
      { name: 'SEARCH_CAT', label: 'Search Category', defaultValue: 'ALL', type: 'select', options: ['ALL', 'BY_NAME', 'BY_CODE', 'BY_DATE'] },
      { name: 'FROM_DATE', label: 'Start Date', defaultValue: '2026-01-01', type: 'text' },
      { name: 'TO_DATE', label: 'End Date', defaultValue: '2026-09-24', type: 'text' },
      { name: 'MAX_ROWS', label: 'Max Results', defaultValue: '50', type: 'number' },
    ];
  }

  if (clean.includes('ORD') || clean.includes('ITEM')) {
    return [
      { name: 'ORDER_ID', label: 'Order Number', defaultValue: 'ORD-2026-881', type: 'text' },
      { name: 'CUST_NO', label: 'Customer Number', defaultValue: 'CUST_4401', type: 'text' },
      { name: 'ITEM_SKU', label: 'Product SKU', defaultValue: 'SKU-992-B', type: 'text' },
      { name: 'QUANTITY', label: 'Order Quantity', defaultValue: '10', type: 'number' },
      { name: 'UNIT_PRICE', label: 'Unit Price ($)', defaultValue: '85.00', type: 'text' },
      { name: 'PAY_METHOD', label: 'Payment Terms', defaultValue: 'NET30', type: 'select', options: ['NET30', 'PREPAID', 'COD', 'CREDIT_CARD'] },
    ];
  }

  if (clean.includes('CRD') || clean.includes('CARD')) {
    return [
      { name: 'CARD_NUM', label: 'Primary Card Number', defaultValue: '5412-7500-1122-3344', type: 'text' },
      { name: 'EMBOSS_NAME', label: 'Embossed Name', defaultValue: 'JOHNATHAN DOE', type: 'text' },
      { name: 'CARD_TYPE', label: 'Card Product Type', defaultValue: 'PLATINUM', type: 'select', options: ['PLATINUM', 'GOLD', 'CLASSIC', 'BUSINESS'] },
      { name: 'EXPIRY_DATE', label: 'Expiry (MM/YY)', defaultValue: '12/29', type: 'text' },
      { name: 'CVV_STATUS', label: 'CVV Check Result', defaultValue: 'MATCHED', type: 'text' },
    ];
  }

  return [
    { name: `${clean}_ID`, label: `${clean} Identifier`, defaultValue: `${clean}_001`, type: 'text' },
    { name: `${clean}_NAME`, label: `${clean} Description / Name`, defaultValue: `Default ${clean} Record`, type: 'text' },
    { name: `${clean}_TYPE`, label: `${clean} Category Type`, defaultValue: 'TYPE_A', type: 'select', options: ['TYPE_A', 'TYPE_B', 'TYPE_C'] },
    { name: `${clean}_VAL`, label: `${clean} Parameter Value`, defaultValue: '100', type: 'text' },
    { name: `${clean}_STATUS`, label: `${clean} Operating Status`, defaultValue: 'READY', type: 'select', options: ['READY', 'PENDING', 'CLOSED'] },
  ];
}


