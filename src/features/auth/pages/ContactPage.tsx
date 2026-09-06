import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Layers, Calendar, Send, CheckCircle2, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/shared/constants/routes';
import './ContactPage.css';

export const ContactPage: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: 'General Inquiry',
    message: '',
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="alsm-contact-page">
      {/* ─── Hero Section ─── */}
      <div className="alsm-contact-hero">
        <span className="alsm-contact-eyebrow">CONTACT</span>
        <h1 className="alsm-contact-title">Let's talk about your modernization journey.</h1>
        <p className="alsm-contact-subtitle">
          Have questions about ALSM or planning a legacy modernization project? Talk with our team.
        </p>
      </div>

      {/* ─── Main Content Container ─── */}
      <main className="alsm-contact-container">
        <div className="alsm-contact-grid">
          {/* ─── Left Column: Info & Meeting Card ─── */}
          <div className="alsm-contact-info-col">
            <div>
              <h2 className="alsm-contact-info-header">Talk to our team</h2>
              <p className="text-sm text-slate-500 mb-6">
                Our legacy modernization specialists are ready to help you evaluate your architecture.
              </p>
            </div>

            <div className="alsm-contact-info-list">
              <div className="alsm-contact-info-item">
                <div className="alsm-contact-info-icon">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="alsm-contact-info-text">
                  <h3>Product Questions</h3>
                  <p>Learn more about ALSM capabilities, parsers, and validation frameworks.</p>
                </div>
              </div>

              <div className="alsm-contact-info-item">
                <div className="alsm-contact-info-icon">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="alsm-contact-info-text">
                  <h3>Modernization Planning</h3>
                  <p>Discuss your BMS/DSPF screen or COBOL logic modernization requirements with an architect.</p>
                </div>
              </div>

              <div className="alsm-contact-info-item">
                <div className="alsm-contact-info-icon">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="alsm-contact-info-text">
                  <h3>Meeting</h3>
                  <p>Schedule a 1-on-1 technical conversation with the ALSM engineering team.</p>
                </div>
              </div>
            </div>

            {/* Prefer a Meeting Card */}
            <div className="alsm-contact-meeting-card">
              <div>
                <h3 className="alsm-contact-meeting-title">Prefer a meeting?</h3>
                <p className="alsm-contact-meeting-desc">
                  Book a direct conversation with our enterprise modernization team to review your codebase.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(ROUTES.BILLING.PRICING)}
                className="alsm-contact-meeting-btn"
              >
                <span>Book a Meeting</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ─── Right Column: Contact Form ─── */}
          <div className="alsm-contact-form-card">
            <h2 className="alsm-contact-form-title">Send us a message</h2>

            {submitted ? (
              <div className="alsm-contact-success-msg">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <span>Thank you! Your message has been received. Our team will reach out shortly.</span>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="alsm-contact-form">
                <div className="alsm-contact-field-group">
                  <label htmlFor="name" className="alsm-contact-label">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="Your full name"
                    value={formData.name}
                    onChange={handleChange}
                    className="alsm-contact-input"
                  />
                </div>

                <div className="alsm-contact-field-group">
                  <label htmlFor="email" className="alsm-contact-label">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="name@company.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="alsm-contact-input"
                  />
                </div>

                <div className="alsm-contact-field-group">
                  <label htmlFor="company" className="alsm-contact-label">
                    Company
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    placeholder="Your organization name"
                    value={formData.company}
                    onChange={handleChange}
                    className="alsm-contact-input"
                  />
                </div>

                <div className="alsm-contact-field-group">
                  <label htmlFor="subject" className="alsm-contact-label">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="alsm-contact-input"
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="BMS / DSPF Modernization">BMS / DSPF Modernization</option>
                    <option value="COBOL Modernization">COBOL Modernization</option>
                    <option value="Enterprise Proof of Concept">Enterprise Proof of Concept</option>
                    <option value="Custom Pricing">Custom Pricing</option>
                  </select>
                </div>

                <div className="alsm-contact-field-group">
                  <label htmlFor="message" className="alsm-contact-label">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    placeholder="Tell us about your legacy modernization goals, screen counts, or timeframe..."
                    value={formData.message}
                    onChange={handleChange}
                    className="alsm-contact-input alsm-contact-textarea"
                  />
                </div>

                <button type="submit" className="alsm-contact-submit-btn">
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ContactPage;
