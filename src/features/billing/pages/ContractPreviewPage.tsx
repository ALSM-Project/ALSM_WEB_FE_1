import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/shared/ui';
import { billingService } from '../services/billing.service';
import { ContractPreviewModal } from '../components/ContractPreviewModal';

export const ContractPreviewPage: React.FC = () => {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContract = async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await billingService.getContractDetail(contractId);
      setContract(data);
    } catch (err: any) {
      console.error('[ContractPreviewPage] Failed to load contract:', err);
      setError(err.message || 'Unable to load contract information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContract();
  }, [contractId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-slate-600">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-semibold text-slate-700">Loading complete enterprise contract document...</p>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center my-12 bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-200">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Contract Does Not Exist</h2>
        <p className="text-sm text-slate-600 mb-6">{error || 'Contract data not found.'}</p>
        <Button onClick={() => navigate('/contracts')} className="bg-blue-600 hover:bg-blue-700 text-white">
          Back to Contracts List
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/contracts/${contractId}`)}
              className="h-8 px-2.5 text-xs text-slate-700 border-slate-300"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Contract Details
            </Button>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Full Contract Document: {contract.contractNumber}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => billingService.downloadContractPdf(contractId!, contract.contractNumber)}
            className="text-xs px-3.5 py-2 border-slate-300 text-slate-700"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download Official PDF
          </Button>
          <Button
            onClick={() => navigate(`/contracts/${contractId}`)}
            className="text-xs px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold"
          >
            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
            Sign / Pay Contract
          </Button>
        </div>
      </div>

      {/* Embedded Full-screen Preview Modal (Always Open in this page) */}
      <ContractPreviewModal
        isOpen={true}
        onClose={() => navigate(`/contracts/${contractId}`)}
        contract={contract}
        onSignClick={() => navigate(`/contracts/${contractId}`)}
        onDownloadPdf={() => billingService.downloadContractPdf(contractId!, contract.contractNumber)}
      />
    </div>
  );
};

export default ContractPreviewPage;
