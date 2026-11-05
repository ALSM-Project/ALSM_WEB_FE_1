import { apiClient } from '@/services/api/apiClient';

export interface CustomerContractListItem {
  contract: {
    id: string;
    contractNumber: string;
    lifecycleStatus: string;
    reviewStatus: string;
  };
  version: {
    id: string;
    versionNumber: number;
    title: string;
    plan: string;
    annualValue: number;
    currency: 'VND';
    effectiveDate: string;
  };
  documentAvailable: boolean;
  canonicalPdfAvailable: boolean;
  reviewPdfAvailable: boolean;
  signedPdfAvailable?: boolean;
  signingAvailable: boolean;
  signingBlockedReason?: string;
  signingReadiness?: {
    status: 'READY' | 'BLOCKED' | 'NOT_READY';
    canStart: boolean;
    checks: Array<{ code: string; status: 'READY' | 'BLOCKED' | 'PENDING' }>;
  };
  demoSigningAvailable?: boolean;
  demoSigningStatus?: 'SENT' | 'COMPLETED';
  demoSigningExpired?: boolean;
  demoNotice?: string;
}

export interface CustomerContractDetail extends CustomerContractListItem {
  contract: CustomerContractListItem['contract'] & {
    customerDecision?: 'NONE' | 'CHANGES_REQUESTED' | 'DECLINED';
    customerDecisionReason?: string;
  };
  version: CustomerContractListItem['version'] & {
    customerName: string;
    customerContactName: string;
    customerEmail: string;
    approvedTemplateVersionId?: string;
    approvedTemplateSnapshot?: {
      templateVersionId: string;
      templateVersionNumber: number;
      title: string;
      locale: 'vi' | 'en' | 'vi-en';
      contentDigest: string;
      sections: Array<{ heading: string; body: string }>;
    };
  };
}

export const customerContractsService = {
  list: () => apiClient.get<CustomerContractListItem[]>('/customer/contracts'),
  get: (contractId: string) => apiClient.get<CustomerContractDetail>(`/customer/contracts/${encodeURIComponent(contractId)}`),
  markViewed: (contractId: string) => apiClient.post<CustomerContractDetail>(
    `/customer/contracts/${encodeURIComponent(contractId)}/viewed`,
    {},
  ),
  downloadReviewPdf: (contractId: string) => apiClient.get<Blob>(
    `/customer/contracts/${encodeURIComponent(contractId)}/review-pdf`,
    { responseType: 'blob' },
  ),
  downloadCanonicalPdf: (contractId: string) => apiClient.get<Blob>(
    `/customer/contracts/${encodeURIComponent(contractId)}/contract-pdf`,
    { responseType: 'blob' },
  ),
  downloadSignedPdf: (contractId: string) => apiClient.get<Blob>(
    `/customer/contracts/${encodeURIComponent(contractId)}/signed-pdf`,
    { responseType: 'blob' },
  ),
  respond: (contractId: string, action: 'REQUEST_CHANGES' | 'DECLINE', reason: string) =>
    apiClient.post<CustomerContractDetail>(`/customer/contracts/${encodeURIComponent(contractId)}/decision`, { action, reason }),
  startDemoSigning: (contractId: string) =>
    apiClient.post<CustomerContractDetail>(`/customer/contracts/${encodeURIComponent(contractId)}/demo-signing/start`, {}),
  completeDemoSigning: (contractId: string, acknowledged: boolean) =>
    apiClient.post<CustomerContractDetail>(`/customer/contracts/${encodeURIComponent(contractId)}/demo-signing/complete`, { acknowledged }),
};
