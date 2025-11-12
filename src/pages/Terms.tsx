import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useApplicationSettings } from "@/contexts/ApplicationSettingsContext";
import { Button } from "@/components/ui/button";
import { Share2, Printer } from "lucide-react";
import { AppSettingsService, SETTING_CATEGORIES } from "@/services/appSettingsService_database";

const Terms = () => {
  const { settings } = useApplicationSettings();
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handlePrint = () => window.print();

  const companyName = settings?.companyDetails?.name || "Our Company";
  const logo = settings?.logo || null;
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const key = 'terms_last_updated';
    (async () => {
      try {
        // Supabase-only read; do not write from public page
        const res = await AppSettingsService.getSetting(SETTING_CATEGORIES.CONTENT, key);
        const value = (res.success && res.data)
          ? (res.data.setting_value || (res.data.setting_json as string | null))
          : null;
        if (isMounted) setLastUpdated(value || new Date().toISOString());
      } catch {
        // Fallback: current date
        if (isMounted) setLastUpdated(new Date().toISOString());
      }
    })();
    return () => { isMounted = false; };
  }, []);

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <Helmet>
        <title>Terms & Conditions</title>
        <meta
          name="description"
          content="Terms & Conditions compliant with global standards (GDPR/CPRA) and Indian DPDP Act."
        />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : ""} />
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white/90 dark:bg-gray-900/90 backdrop-blur">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4">
          <a href="/" className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt={companyName} className="h-8 w-auto object-contain" />
            ) : (
              <div className="h-8 w-8 bg-blue-600 text-white rounded flex items-center justify-center font-bold">
                {companyName?.charAt(0)}
              </div>
            )}
            <span className="font-semibold">{companyName}</span>
          </a>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Share2 className="h-4 w-4 mr-2" /> {copied ? "Link copied" : "Share"}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" /> Print
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Terms & Conditions</h1>
        <p className="mb-4">
          Welcome to {companyName}. By accessing or using our platform, you agree to these Terms & Conditions. Please read them carefully.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
        <p className="mb-4">
          By creating an account or using our services, you agree to be bound by these Terms and any updates we may publish. If you do not agree, please discontinue use of the platform.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Eligibility & Account Responsibilities</h2>
        <p className="mb-4">
          You represent that you are at least the age of majority in your jurisdiction and legally capable of entering into binding agreements. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Acceptable Use</h2>
        <p className="mb-4">
          You agree not to misuse the platform, including but not limited to: violating applicable laws; infringing intellectual property; transmitting malware; scraping without permission; circumventing security; or engaging in fraudulent activities.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. Services, Content & Intellectual Property</h2>
        <p className="mb-4">
          The platform, including software, text, graphics, logos, and content, is owned by or licensed to {companyName} and is protected by applicable IP laws. You may not copy, modify, distribute, sell, or lease any part of the Services unless we provide written permission.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Third-Party Services</h2>
        <p className="mb-4">
          We may integrate third-party services (e.g., analytics, payment gateways, cloud hosting). Your use of such services may be subject to their terms. We are not responsible for third-party content or practices.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Payment, Taxes & Refunds</h2>
        <p className="mb-4">
          If paid services are offered, prices and taxes will be disclosed prior to purchase. Unless otherwise stated, fees are non-refundable except as required by law. Refunds, if applicable, follow our posted policies.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Compliance: Global & India</h2>
        <p className="mb-4">
          We aim to comply with international standards, including the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act/CPRA (US), and India’s Digital Personal Data Protection Act, 2023 (DPDP Act). See our Privacy Policy for details on rights and processing.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">8. Limitation of Liability</h2>
        <p className="mb-4">
          To the maximum extent permitted by law, {companyName} is not liable for indirect, incidental, special, consequential, or punitive damages, or loss of profits, data, goodwill, or other intangible losses arising from your use of the Services.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">9. Indemnification</h2>
        <p className="mb-4">
          You agree to indemnify and hold {companyName} and its affiliates harmless from any claims, liabilities, damages, losses, and expenses, including legal fees, arising out of your use of the Services or violation of these Terms.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">10. Governing Law & Dispute Resolution</h2>
        <p className="mb-4">
          These Terms are governed by the laws of India, without regard to conflict-of-laws principles. Disputes will be subject to the exclusive jurisdiction of courts located in India. Where applicable, and if mutually agreed, disputes may be resolved through arbitration pursuant to the Arbitration and Conciliation Act, 1996.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">11. Termination</h2>
        <p className="mb-4">
          We may suspend or terminate access for violations of these Terms or as required by law. You may stop using the Services at any time. Sections that by nature should survive termination (e.g., IP, liability, indemnity) will continue to apply.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">12. Changes to These Terms</h2>
        <p className="mb-4">
          We may update these Terms periodically. Material changes will be posted here with a revised “Last Updated” date. Continued use after changes constitutes acceptance.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">13. Contact</h2>
        <p className="mb-4">
          Questions about these Terms? Contact us at <a href="mailto:support@example.com" className="text-blue-600 hover:text-blue-800">support@example.com</a>.
        </p>

        <p className="text-sm text-gray-500 mt-8">Last Updated: {formatDate(lastUpdated)}</p>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="max-w-4xl mx-auto p-6 text-sm text-gray-600 dark:text-gray-400 flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center sm:justify-between">
          <div>
            © {new Date().getFullYear()} {companyName}. All rights reserved.
          </div>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:underline">Privacy Policy</a>
            <a href="/terms" className="hover:underline">Terms & Conditions</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Terms;
