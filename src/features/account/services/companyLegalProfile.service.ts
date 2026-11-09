import { apiClient } from '@/services/api/apiClient';

export interface TaxLookupStatus {
  isConfigured: boolean;
  providerName: string;
  supportedFormats: string[];
  message?: string;
}

export interface TaxLookupResult {
  taxId: string;
  legalCompanyName: string;
  registeredAddress: string;
  businessRegistrationNumber?: string;
  companyStatus?: string;
  dataSource: string;
  lookupTimestamp: string;
  verificationStatus: 'TAX_VERIFIED';
  identityVerified: boolean;
  disclaimer: string;
}

export interface CustomerLegalProfile {
  taxId: string;
  legalCompanyName: string;
  registeredAddress: string;
  businessRegistrationNumber?: string;
  legalRepresentative: string;
  representativeTitle: string;
  contactEmail: string;
  contactPhone?: string;
  companyStatus?: string;
  dataSource?: string;
  lookupTimestamp?: string;
  verificationStatus: 'UNVERIFIED' | 'TAX_VERIFIED' | 'REPRESENTATIVE_VERIFIED' | 'REJECTED';
  verifiedAt?: string;
  notes?: string;
}

export interface OrganizationLegalProfileResponse {
  organizationId: string;
  organizationName: string;
  legalProfile: CustomerLegalProfile;
}

export class CompanyLegalProfileService {
  async getTaxLookupStatus(): Promise<TaxLookupStatus> {
    return apiClient.get<TaxLookupStatus>('/tax-lookup/status');
  }

  async lookupTaxId(taxId: string): Promise<TaxLookupResult> {
    return apiClient.get<TaxLookupResult>(`/tax-lookup/${encodeURIComponent(taxId)}`);
  }

  async getLegalProfile(orgId: string): Promise<OrganizationLegalProfileResponse> {
    return apiClient.get<OrganizationLegalProfileResponse>(`/organizations/${encodeURIComponent(orgId)}/legal-profile`);
  }

  async updateLegalProfile(orgId: string, data: Partial<CustomerLegalProfile>): Promise<OrganizationLegalProfileResponse> {
    return apiClient.put<OrganizationLegalProfileResponse>(`/organizations/${encodeURIComponent(orgId)}/legal-profile`, data);
  }
}

export const companyLegalProfileService = new CompanyLegalProfileService();
