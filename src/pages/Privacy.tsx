import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useApplicationSettings } from "@/contexts/ApplicationSettingsContext";
import { Button } from "@/components/ui/button";
import { Share2, Printer } from "lucide-react";
import { AppSettingsService, SETTING_CATEGORIES } from "@/services/appSettingsService_database";

const Privacy: React.FC = () => {
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
  const contactEmail = settings?.companyDetails?.email || "privacy@example.com";
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const key = 'privacy_last_updated';
    (async () => {
      try {
        // Read from local storage only to avoid Supabase calls on public pages
        const res = await AppSettingsService.getSettingFromStorage(SETTING_CATEGORIES.CONTENT, key);
        let value = (res.success && res.data) ? (res.data.setting_value || (res.data.setting_json as string | null)) : null;
        if (!value) {
          // Seed a default ISO date in local storage for first run
          value = new Date().toISOString();
          await AppSettingsService.createSettingInStorage({
            category: SETTING_CATEGORIES.CONTENT,
            setting_key: key,
            setting_value: value,
            description: 'Last updated date for Privacy Policy',
            data_type: 'date',
            is_active: true
          });
        }
        if (isMounted) setLastUpdated(value);
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
        <title>Privacy Policy</title>
        <meta
          name="description"
          content="Privacy Policy compliant with GDPR, CPRA, and India’s DPDP Act, including app store disclosures."
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
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4">
          {companyName} is committed to protecting your privacy. This Privacy Policy explains what personal information we collect, how we use it, and the rights available to you under applicable laws, including the EU General Data Protection Regulation (GDPR), California Consumer Privacy Act/CPRA, and India’s Digital Personal Data Protection Act, 2023 (DPDP Act).
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">1. Data Controller</h2>
        <p className="mb-4">
          {companyName} acts as the Data Controller for personal data we process. For inquiries, contact us at <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:text-blue-800">{contactEmail}</a>.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">2. Information We Collect</h2>
        <p className="mb-2">We may collect the following categories of information:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Account details: name, email, phone, username, company information.</li>
          <li>Transactional data: purchases, subscriptions, payment status (processed via secure payment gateways).</li>
          <li>Usage data: pages visited, features used, interactions, crash logs.</li>
          <li>Device data: IP address, device identifiers (e.g., IDFA/GAID), OS version, browser/app version.</li>
          <li>Location data: approximate location derived from IP or, if enabled, precise device location.</li>
          <li>Communications: support requests, feedback, and correspondence.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">3. Sources of Data</h2>
        <p className="mb-4">Directly from you (account creation, forms), automatically through your device and our services, and from service providers who assist us (analytics, payment processing, cloud hosting).</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">4. How We Use Your Information</h2>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Provide, maintain, and improve our services.</li>
          <li>Authenticate users and secure accounts.</li>
          <li>Process transactions and provide customer support.</li>
          <li>Analyze usage, measure performance, and prevent fraud.</li>
          <li>Send service-related communications and, with consent, marketing messages you can opt out of.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">5. Legal Bases (GDPR)</h2>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Consent (e.g., marketing, precise location, analytics where required).</li>
          <li>Contract (to deliver the services you request).</li>
          <li>Legitimate interests (e.g., security, service improvement).</li>
          <li>Legal obligations (e.g., tax and compliance requirements).</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">6. Sharing & Disclosure</h2>
        <p className="mb-4">
          We share data with processors/service providers solely to operate our services (e.g., cloud hosting, analytics, payments, email delivery). We do not sell personal information. We may disclose data if required by law or to protect rights, property, or safety.
        </p>

        <h2 className="text-xl font-semibold mt-6 mb-2">7. Data Retention</h2>
        <p className="mb-4">We retain personal data only as long as necessary for the purposes above or as required by law. When no longer needed, data is securely deleted or anonymized.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">8. Security</h2>
        <p className="mb-4">We implement reasonable technical and organizational measures to protect your data, including encryption in transit, access controls, and monitoring. No method of transmission is 100% secure; we strive to continuously improve security.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">9. International Transfers</h2>
        <p className="mb-4">If data is transferred internationally, we use appropriate safeguards (e.g., Standard Contractual Clauses) to protect personal information.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">10. Your Rights</h2>
        <p className="mb-2">Depending on your jurisdiction, you may have rights to:</p>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Access, correct, delete, and port your data (GDPR, CPRA, DPDP).</li>
          <li>Restrict or object to processing; withdraw consent at any time.</li>
          <li>Opt out of sale/sharing and limit use of sensitive information (CPRA).</li>
          <li>Grievance redressal and consent management mechanisms (DPDP Act).</li>
        </ul>
        <p className="mb-4">To exercise rights, contact <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:text-blue-800">{contactEmail}</a>. We may need to verify your identity to process requests.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">11. Children’s Privacy</h2>
        <p className="mb-4">Our services are not directed to children under 13 (or higher age as required by local law). We do not knowingly collect personal data from children. If you believe a child has provided data, please contact us to remove it.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">12. Mobile Platforms & App Store Disclosures</h2>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Device identifiers (IDFA on iOS, GAID on Android) may be used for analytics/advertising, subject to your consent and platform settings.</li>
          <li>App Tracking Transparency (iOS) and Android privacy controls are respected. You can change permissions in device settings.</li>
          <li>Push notifications, camera, microphone, photos, contacts, and location are accessed only with your permission and used solely for the requested features.</li>
          <li>Crash logs and diagnostics may be collected to improve stability.</li>
        </ul>

        <h2 className="text-xl font-semibold mt-6 mb-2">13. Cookies & Similar Technologies</h2>
        <p className="mb-4">We use cookies and similar technologies to operate and improve the service. You can manage preferences via browser/app settings. Some features may not function without certain cookies.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">14. Do Not Track</h2>
        <p className="mb-4">Our services do not respond to “Do Not Track” signals. Tracking preferences can be managed via browser and device settings.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">15. Changes to This Policy</h2>
        <p className="mb-4">We may update this Privacy Policy periodically. Material changes will be posted here with a revised “Last Updated” date. Continued use after changes constitutes acceptance.</p>

        <h2 className="text-xl font-semibold mt-6 mb-2">16. Contact & Grievance Officer (India)</h2>
        <p className="mb-4">
          If you have questions or complaints, contact our Privacy team at <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:text-blue-800">{contactEmail}</a>. For India-specific concerns under the DPDP Act, you may also reach our Grievance Officer via the same email.
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

export default Privacy;
