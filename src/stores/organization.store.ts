export interface OrganizationStoreState {
  currentOrganizationId: string | null;
  organizationName: string | null;
}

export const initialOrganizationState: OrganizationStoreState = {
  currentOrganizationId: 'org-acme-corp',
  organizationName: 'Acme Corp Enterprise',
};
