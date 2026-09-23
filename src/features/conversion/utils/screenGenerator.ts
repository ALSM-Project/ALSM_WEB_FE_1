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
 * Deterministically generates screen fields, TSX code, DTOs, and LOC count
 * based on the BMS/DSPF/COBOL screen name.
 */
export function generateScreenBundle(screenName: string): GeneratedScreenBundle {
  const cleanName = screenName.replace(/\.(bms|dspf|cob|cbl|dds)$/i, '');
  const pascalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1).replace(/[^A-Za-z0-9]/g, '');
  const upper = cleanName.toUpperCase();

  let fields: ScreenField[] = [];
  let title = `${upper} Modernized Screen`;
  let subtitle = `CICS Legacy Screen (${screenName} → React Form)`;

  if (upper.includes('COUSR01') || upper.includes('USER01')) {
    title = 'CICS User Profile Inquiry & Create';
    subtitle = 'User Profile Management (BMS Map → React Form)';
    fields = [
      { name: 'USERID', label: 'User Identifier (USERID)', defaultValue: 'USR-88401' },
      { name: 'FNAME', label: 'First Name (FNAME)', defaultValue: 'ALEXANDER' },
      { name: 'LNAME', label: 'Last Name (LNAME)', defaultValue: 'HAMILTON' },
      { name: 'EMAIL', label: 'Email Address (EMAIL)', defaultValue: 'a.hamilton@financial.org', fullWidth: true },
      { name: 'ROLE', label: 'System Role (ROLE)', defaultValue: 'ADMINISTRATOR', type: 'select', options: ['ADMINISTRATOR', 'OPERATOR', 'AUDITOR', 'GUEST'] },
      { name: 'DEPT', label: 'Department Code (DEPT)', defaultValue: 'TREASURY' },
    ];
  } else if (upper.includes('COACT') || upper.includes('ACTUP') || upper.includes('COUSR02') || upper.includes('ACCT')) {
    title = 'CardDemo - Account Update Screen';
    subtitle = 'Card Account & Customer Management (COACTUP.bms → React Form)';
    fields = [
      { name: 'ACCTSID', label: 'Account Number (ACCTSID)', defaultValue: '00000000001' },
      { name: 'ACSTTUS', label: 'Active Status (ACSTTUS)', defaultValue: 'Y', type: 'select', options: ['Y', 'N'] },
      { name: 'ACRDLIM', label: 'Credit Limit (ACRDLIM)', defaultValue: '$50,000.00' },
      { name: 'ACSHLIM', label: 'Cash Credit Limit (ACSHLIM)', defaultValue: '$10,000.00' },
      { name: 'ACURBAL', label: 'Current Balance (ACURBAL)', defaultValue: '$1,250.00' },
      { name: 'ACSTNUM', label: 'Customer ID (ACSTNUM)', defaultValue: '000000089' },
      { name: 'ACSFNAM', label: 'First Name (ACSFNAM)', defaultValue: 'JANE' },
      { name: 'ACSMNAM', label: 'Middle Name (ACSMNAM)', defaultValue: 'MARIA' },
      { name: 'ACSLNAM', label: 'Last Name (ACSLNAM)', defaultValue: 'DOE' },
      { name: 'ACSADL1', label: 'Address Line 1 (ACSADL1)', defaultValue: '123 BROADWAY AVE', fullWidth: true },
      { name: 'ACSCITY', label: 'City (ACSCITY)', defaultValue: 'NEW YORK' },
      { name: 'ACSSTTE', label: 'State (ACSSTTE)', defaultValue: 'NY' },
      { name: 'ACSZIPC', label: 'Zip Code (ACSZIPC)', defaultValue: '10001' },
      { name: 'ACSPFLG', label: 'Primary Card Holder (ACSPFLG)', defaultValue: 'Y', type: 'select', options: ['Y', 'N'] },
    ];
  } else if (upper.includes('COUSR03') || upper.includes('DELUSR') || upper.includes('DELETEUSER')) {
    title = 'CardDemo - Delete User';
    subtitle = 'Delete User Management (COUSR03.bms → React Form)';
    fields = [
      { name: 'USRIDIN', label: 'Enter User ID (USRIDIN)', defaultValue: 'USR-00928' },
      { name: 'FNAME', label: 'First Name (FNAME)', defaultValue: 'ALEXANDER' },
      { name: 'LNAME', label: 'Last Name (LNAME)', defaultValue: 'HAMILTON' },
      { name: 'USRTYPE', label: 'User Type (USRTYPE)', defaultValue: 'U (User)', type: 'select', options: ['A (Admin)', 'U (User)'] },
      { name: 'ERRMSG', label: 'System Message (ERRMSG)', defaultValue: 'Ready for user deletion. Press Delete to confirm.', fullWidth: true },
    ];
  } else if (upper.includes('COCRD') || upper.includes('CARD')) {
    title = 'CardDemo - Credit Card Details & Limit';
    subtitle = 'Credit Card Management (COCRD01.bms → React Form)';
    fields = [
      { name: 'CARDNO', label: 'Card Number (CARDNO)', defaultValue: '4532-8819-2049-8891' },
      { name: 'CRDNAME', label: 'Cardholder Name (CRDNAME)', defaultValue: 'HOANG ENTERPRISE CORP', fullWidth: true },
      { name: 'EXPDATE', label: 'Expiration Date (EXPDATE)', defaultValue: '12/28' },
      { name: 'CARDTYPE', label: 'Card Type (CARDTYPE)', defaultValue: 'VISA GOLD', type: 'select', options: ['VISA GOLD', 'MASTERCARD PLATINUM', 'AMEX CORPORATE'] },
      { name: 'CVV', label: 'Security Code (CVV)', defaultValue: '***', type: 'password' },
      { name: 'DAYLIMIT', label: 'Daily ATM Limit (DAYLIMIT)', defaultValue: '$10,000.00' },
      { name: 'CARDSTAT', label: 'Card Status (CARDSTAT)', defaultValue: 'ISSUED', type: 'select', options: ['ISSUED', 'SUSPENDED', 'CANCELLED'] },
    ];
  } else if (upper.includes('COTRN') || upper.includes('TRN') || upper.includes('PAY')) {
    title = 'CICS Financial Transaction Entry';
    subtitle = 'Transaction Post & Clearance (BMS Map → React Form)';
    fields = [
      { name: 'TRNID', label: 'Transaction Reference (TRNID)', defaultValue: 'TXN-90214819' },
      { name: 'ACCTNO', label: 'Source Account (ACCTNO)', defaultValue: '4000-1234-5678-9010' },
      { name: 'TRNAMT', label: 'Transaction Amount (TRNAMT)', defaultValue: '$1,250.00' },
      { name: 'TRNDATE', label: 'Posting Date (TRNDATE)', defaultValue: '2026-09-22 14:30:00' },
      { name: 'MERCHANT', label: 'Merchant Identifier (MERCHANT)', defaultValue: 'GLOBAL SUPPLIES INC', fullWidth: true },
      { name: 'TRNTYPE', label: 'Transaction Type (TRNTYPE)', defaultValue: 'DEBIT', type: 'select', options: ['DEBIT', 'CREDIT', 'REFUND', 'ADJUSTMENT'] },
    ];
  } else if (upper.includes('COSGN') || upper.includes('SIGN') || upper.includes('LOGON') || upper.includes('LOGIN')) {
    title = 'CardDemo - Sign On Screen';
    subtitle = 'CICS User Authentication (COSGN00.bms → React Form)';
    fields = [
      { name: 'USERID', label: 'User Identifier (USERID)', defaultValue: 'CICSUSER' },
      { name: 'PASSWD', label: 'Password (PASSWD)', defaultValue: '••••••••', type: 'password' },
      { name: 'ERRMSG', label: 'System Message (ERRMSG)', defaultValue: 'Welcome to CardDemo System. Enter User ID & Password.', fullWidth: true },
    ];
  } else {
    // Deterministic fallback fields generator based on string hash
    let hash = 0;
    for (let i = 0; i < upper.length; i++) hash = (hash << 5) - hash + upper.charCodeAt(i);

    fields = [
      { name: 'USERID', label: 'Operator ID (USERID)', defaultValue: `OPR-${Math.abs(hash % 900) + 100}` },
      { name: 'REFCODE', label: `${upper} Reference Code (REFCODE)`, defaultValue: `REF-${Math.abs(hash % 90000) + 10000}` },
      { name: 'STATUS', label: 'Process Status (STATUS)', defaultValue: 'ACTIVE', type: 'select', options: ['ACTIVE', 'PENDING', 'SUSPENDED'] },
      { name: 'REMARKS', label: 'System Audit Notes (REMARKS)', defaultValue: 'Converted from BMS legacy map', fullWidth: true },
    ];
    title = `${upper} Modernized Screen`;
    subtitle = `Legacy BMS/DSPF Screen (${screenName} → React Form)`;
  }

  // Generate TSX component source code
  const fieldStateProps = fields.map((f) => `  ${f.name.toLowerCase()}: string;`).join('\n');
  const fieldInitState = fields.map((f) => `    ${f.name.toLowerCase()}: '${f.defaultValue}',`).join('\n');

  const tsxContent = `import React, { useState } from 'react';

export interface ${pascalName}FormData {
${fieldStateProps}
}

/**
 * Modernized React Component for ${screenName}
 * ${subtitle}
 * Generated deterministically by ALSM Modernization Engine
 */
export const ${pascalName}Screen: React.FC = () => {
  const [formData, setFormData] = useState<${pascalName}FormData>({
${fieldInitState}
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitted ${screenName} Modernized Form:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-white rounded-2xl border border-slate-200 space-y-4">
      <h2 className="text-lg font-bold text-slate-900">${title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
${fields
  .map(
    (f) => `        <div${f.fullWidth ? ' className="md:col-span-2"' : ''}>
          <label className="block text-slate-700 font-semibold mb-1">${f.label}</label>
          ${
            f.type === 'select'
              ? `<select
            value={formData.${f.name.toLowerCase()}}
            onChange={(e) => setFormData({ ...formData, ${f.name.toLowerCase()}: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900"
          >
${(f.options || []).map((opt) => `            <option value="${opt}">${opt}</option>`).join('\n')}
          </select>`
              : `<input
            type="${f.type || 'text'}"
            value={formData.${f.name.toLowerCase()}}
            onChange={(e) => setFormData({ ...formData, ${f.name.toLowerCase()}: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono text-slate-900"
          />`
          }
        </div>`,
  )
  .join('\n')}
      </div>
      <div className="flex space-x-3 pt-2">
        <button type="submit" className="px-4 py-2 bg-[#0652CC] text-white text-xs font-bold rounded-lg shadow-xs">
          Submit Form
        </button>
        <button type="button" className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg">
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ${pascalName}Screen;`;

  // Generate DTO source code
  const dtoProps = fields.map((f) => `  ${f.name}: string;`).join('\n');
  const dtoContent = `/**
 * Data Transfer Object for ${screenName}
 * Generated deterministically by ALSM Modernization Engine
 */
export interface ${pascalName}Dto {
${dtoProps}
  LAST_UPDATED: string;
}`;

  const files = [
    {
      relativePath: `src/components/${pascalName}Screen.tsx`,
      language: 'typescript',
      content: tsxContent,
    },
    {
      relativePath: `src/types/${cleanName}.dto.ts`,
      language: 'typescript',
      content: dtoContent,
    },
  ];

  const linesOfCode = files.reduce((sum, f) => sum + f.content.split('\n').length, 0);

  return {
    title,
    subtitle,
    fields,
    files,
    linesOfCode,
  };
}

/**
 * Parses converted React TSX source code to dynamically extract
 * screen title, subtitle, form fields, inputs, selects, and default values
 * for rendering the UI Preview directly from the generated React component.
 */
export function parseConvertedTsx(tsxCode: string, fallbackName = 'Screen'): GeneratedScreenBundle {
  if (!tsxCode || typeof tsxCode !== 'string' || tsxCode.trim().length === 0) {
    return generateScreenBundle(fallbackName);
  }

  // 1. Title
  const titleMatch = tsxCode.match(/<title[^>]*>(.*?)<\/title>/i) || tsxCode.match(/<h2[^>]*>(.*?)<\/h2>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `${fallbackName} Modernized Screen`;

  // 2. Subtitle
  const subtitle = `Modernized React Component (${fallbackName})`;

  // 3. Extract Default Values from useState
  const defaultValues: Record<string, string> = {};
  const useStateMatch = tsxCode.match(/useState\s*(?:<[^>]+>)?\s*\(\s*\{([\s\S]*?)\}\s*\)/);
  if (useStateMatch) {
    const stateBody = useStateMatch[1];
    const kvMatches = stateBody.matchAll(/([a-zA-Z0-9_]+)\s*:\s*['"]([^'"]*)['"]/g);
    for (const kv of kvMatches) {
      defaultValues[kv[1].toUpperCase()] = kv[2];
    }
  }

  const fields: ScreenField[] = [];

  // Parse <Input ... /> tags generated by bms2react / dspf2react
  const inputTagMatches = Array.from(tsxCode.matchAll(/<Input\s+([^>]+)\/?>/gi));
  for (const match of inputTagMatches) {
    const props = match[1];
    const nameMatch = props.match(/name=['"]([^'"]+)['"]/i) || props.match(/id=['"]([^'"]+)['"]/i);
    const typeMatch = props.match(/type=['"]([^'"]+)['"]/i);
    if (nameMatch) {
      const fieldName = nameMatch[1].toUpperCase();
      const fieldType = typeMatch && typeMatch[1] === 'number' ? 'number' : 'text';
      fields.push({
        name: fieldName,
        label: `${fieldName} Field`,
        defaultValue: defaultValues[fieldName] || '',
        type: fieldType,
      });
    }
  }

  // Parse standard <label> tags
  const labelTagMatches = Array.from(tsxCode.matchAll(/<label[^>]*>([\s\S]*?)<\/label>/gi));
  for (const match of labelTagMatches) {
    const labelContent = match[1].replace(/[{}]/g, '').trim();
    if (labelContent && !labelContent.includes('receivedData') && labelContent.length < 100) {
      const fieldName = `LABEL_${fields.length + 1}`;
      fields.push({
        name: fieldName,
        label: labelContent,
        defaultValue: labelContent,
        type: 'text',
      });
    }
  }

  if (fields.length < 2) {
    return generateScreenBundle(fallbackName);
  }

  return {
    title,
    subtitle,
    fields,
    files: [],
    linesOfCode: tsxCode.split('\n').length,
  };
}

