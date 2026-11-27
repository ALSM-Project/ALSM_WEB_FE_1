import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  Paperclip,
  RotateCcw,
  Send,
  Star,
  Trash2,
} from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import {
  FEEDBACK_CATEGORIES,
  feedbackService,
  type FeedbackCategory,
  type FeedbackItem,
  type FeedbackStatus,
} from '../services/feedback.service';
import {
  formatFileSize,
  uploadSupportAttachment,
  type SupportAttachmentItem,
} from '@/features/chat/supportAttachment.service';

const STATUS_BADGE_MAP: Record<FeedbackStatus, { label: string; className: string }> = {
  SUBMITTED: {
    label: 'Submitted',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  IN_REVIEW: {
    label: 'In Review',
    className: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  ACKNOWLEDGED: {
    label: 'Acknowledged',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
};

const RATING_LABELS: Record<number, string> = {
  1: 'Very Poor',
  2: 'Poor',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

export const FeedbackPage: React.FC = () => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<FeedbackCategory>('Overall Experience');
  const [description, setDescription] = useState<string>('');
  const [attachment, setAttachment] = useState<SupportAttachmentItem | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [history, setHistory] = useState<FeedbackItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);
      const items = await feedbackService.listMyFeedback();
      setHistory(items);
    } catch {
      setHistoryError('We could not load your feedback history. Please refresh to try again.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleReset = () => {
    setRating(0);
    setHoverRating(0);
    setCategory('Overall Experience');
    setDescription('');
    setAttachment(null);
    setFormError(null);
    setSubmitSuccess(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setFormError(null);
      const uploaded = await uploadSupportAttachment(file);
      setAttachment(uploaded);
    } catch {
      setFormError('Unable to upload the selected attachment. Please check the file type and size (max 10 MB).');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitSuccess(null);

    if (rating < 1 || rating > 5) {
      setFormError('Please select a star rating from 1 to 5.');
      return;
    }

    if (!description.trim()) {
      setFormError('Please enter a feedback description before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await feedbackService.submitFeedback({
        rating,
        category,
        description: description.trim(),
        attachments: attachment ? [attachment] : [],
      });
      setHistory((prev) => [created, ...prev]);
      setRating(0);
      setHoverRating(0);
      setCategory('Overall Experience');
      setDescription('');
      setAttachment(null);
      setSubmitSuccess('Thank you! Your feedback has been submitted and recorded.');
    } catch {
      setFormError('We could not submit your feedback right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const activeStar = hoverRating || rating;

  return (
    <div className="w-full space-y-6">
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Feedback &amp; Reviews
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-[65ch]">
            Share your experience with the ALSM platform. Your feedback is reviewed directly by our product and support teams.
          </p>
        </div>

        {submitSuccess && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm font-medium text-emerald-800"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>{submitSuccess}</span>
          </div>
        )}

        {formError && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-xs sm:text-sm font-medium text-[#D92D20]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-[#D92D20]" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Interactive 1-5 Star Rating */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Rating <span className="text-rose-600">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <div
                className="inline-flex items-center gap-1.5"
                role="radiogroup"
                aria-label="Rating from 1 to 5 stars"
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled = starValue <= activeStar;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      role="radio"
                      aria-checked={rating === starValue}
                      aria-label={`${starValue} star${starValue === 1 ? '' : 's'} (${RATING_LABELS[starValue]})`}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1.5 rounded-lg transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#244A70]/40 cursor-pointer"
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          isFilled
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 hover:text-amber-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {activeStar > 0 && (
                <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                  {activeStar}/5 — {RATING_LABELS[activeStar]}
                </span>
              )}
            </div>
          </div>

          {/* Feedback Category */}
          <div className="space-y-2 max-w-md">
            <label
              htmlFor="feedback-category"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Feedback Category <span className="text-rose-600">*</span>
            </label>
            <select
              id="feedback-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-[#244A70] focus:outline-none focus:ring-2 focus:ring-[#244A70]/20"
            >
              {FEEDBACK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback Description */}
          <div className="space-y-2">
            <label
              htmlFor="feedback-description"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-700"
            >
              Description <span className="text-rose-600">*</span>
            </label>
            <textarea
              id="feedback-description"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={4000}
              placeholder="Describe what worked well, what could be improved, or any issue you encountered..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#244A70] focus:outline-none focus:ring-2 focus:ring-[#244A70]/20 resize-y"
            />
            <p className="text-xs text-slate-500 text-right">{description.length}/4000</p>
          </div>

          {/* Optional Attachment */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Attachment (Optional)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              accept="image/*,.pdf,.txt,.csv,.json,.doc,.docx,.xls,.xlsx,.zip"
              className="hidden"
              aria-label="Upload optional feedback attachment"
            />
            {attachment ? (
              <div className="inline-flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800">
                <FileText className="w-4 h-4 text-[#244A70] shrink-0" />
                <span className="font-medium truncate max-w-[260px]">{attachment.name}</span>
                {attachment.size ? (
                  <span className="text-slate-500 shrink-0">{formatFileSize(attachment.size)}</span>
                ) : null}
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label="Remove attachment"
                  className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  isLoading={uploading}
                  disabled={uploading || submitting}
                  className="inline-flex items-center gap-2"
                >
                  <Paperclip className="w-4 h-4" />
                  <span>{uploading ? 'Uploading...' : 'Attach Image or File'}</span>
                </Button>
                <p className="mt-1.5 text-xs text-slate-500">
                  Supported: images, PDF, TXT, CSV, JSON, Office documents, ZIP (max 10 MB).
                </p>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleReset}
              disabled={submitting || uploading}
              className="inline-flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              type="submit"
              isLoading={submitting}
              disabled={submitting || uploading}
              className="inline-flex items-center gap-1.5 bg-[#244A70] hover:bg-[#1B3856] text-white"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Feedback</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Feedback History */}
      <div className="w-full bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Feedback History</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-600">
            Track the review status of your submitted feedback.
          </p>
        </div>

        {historyLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-[#244A70]" />
            <span>Loading your feedback history...</span>
          </div>
        ) : historyError ? (
          <div role="alert" className="rounded-lg border border-[#FECDCA] bg-[#FEF3F2] p-4 text-xs sm:text-sm font-medium text-[#D92D20]">
            {historyError}
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-600">
            You haven&apos;t submitted any feedback yet.
          </div>
        ) : (
          <ul className="space-y-3.5" aria-label="Submitted feedback history">
            {history.map((item) => {
              const badge = STATUS_BADGE_MAP[item.status] || STATUS_BADGE_MAP.SUBMITTED;
              const submittedDate = new Date(item.createdAt).toLocaleString();

              return (
                <li
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-xs font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                        {item.category}
                      </span>
                      <div className="inline-flex items-center gap-0.5" aria-label={`Rated ${item.rating} out of 5 stars`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${
                              n <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">{submittedDate}</span>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
                    {item.description}
                  </p>

                  {item.attachments && item.attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.attachments.map((att, idx) => (
                        <span
                          key={att.fileId || idx}
                          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#244A70]" />
                          <span>{att.name}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {item.staffNotes && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/70 px-3 py-2 text-xs text-slate-700">
                      <span className="font-semibold text-[#244A70]">Support Team Note: </span>
                      <span>{item.staffNotes}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default FeedbackPage;
