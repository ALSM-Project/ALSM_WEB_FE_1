import { apiClient } from '@/services/api/apiClient';

export interface ResolvedProspectInvitation {
  status: 'INVITATION_VALID';
  recipientEmail: string;
  expiresAt: string;
  nextAction: 'SIGN_IN_OR_REGISTER_THEN_VERIFY_EMAIL_AND_ACCEPT';
}

export interface AcceptedProspectInvitation {
  grantId: string;
  leadId: string;
  phoneVerificationStatus: 'UNVERIFIED';
  signingEligibility: 'BLOCKED_PHONE_UNVERIFIED';
  message: string;
}

export const prospectInvitationService = {
  resolve: (invitationToken: string) => apiClient.post<ResolvedProspectInvitation>(
    '/auth/prospects/invitations/resolve',
    { invitationToken },
    { auth: false },
  ),

  register: (input: { invitationToken: string; fullName: string; password: string }) => apiClient.post<{ accepted: boolean; message: string }>(
    '/auth/prospects/register',
    input,
    { auth: false },
  ),

  accept: (invitationToken: string) => apiClient.post<AcceptedProspectInvitation>(
    '/auth/prospects/invitations/accept',
    { invitationToken },
  ),
};
