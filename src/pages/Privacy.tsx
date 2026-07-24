import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { SEO } from "@/components/SEO";

export default function Privacy() {
  const lastUpdated = "July 24, 2026";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Privacy Policy — OptimizeMySuite"
        description="OptimizeMySuite privacy policy: what data we collect, how we use it, and your rights."
        canonicalPath="/privacy"
      />

      <nav className="container pt-6 px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <HeaderBrand textFallback />
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </nav>

      <main className="container py-12 sm:py-16 lg:py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-display">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-10">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground/80">
            <p>
              This Privacy Policy explains how OptimizeMySuite ("we", "us", or "our") collects,
              uses, stores, and protects your information when you use our website and SaaS platform
              at optimizemysuite.com (the "Service"). OptimizeMySuite is operated from Florida, USA.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. Information we collect</h2>
            <p>
              <strong>Account information:</strong> When you create an account, we collect your email address
              and any name or company information you choose to provide. This is used to authenticate you,
              manage your workspace, and communicate about your account.
            </p>
            <p>
              <strong>Audited website URLs:</strong> When you run a website audit, we store the URL you submit
              and the resulting analysis data, including the scores, findings, and reports we generate. This
              is the core functionality of the Service.
            </p>
            <p>
              <strong>Lead information:</strong> Our free audit widget may ask for your name and email address
              before delivering results. This information is used to follow up with you about the Service and is
              stored as a lead record.
            </p>
            <p>
              <strong>Payment information:</strong> Subscription payments are processed through Stripe. We do not
              store full credit card numbers or other sensitive payment instrument details on our servers. Stripe
              handles payment processing in accordance with its own privacy policy and security standards.
            </p>
            <p>
              <strong>Usage data and cookies:</strong> We use standard cookies and analytics tools to understand
              how visitors use our website, diagnose technical issues, and improve the Service. This may include
              your IP address, browser type, device information, and pages visited.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. How we use your information</h2>
            <p>
              We use the information we collect to provide and improve the Service, process payments,
              communicate with you, respond to support requests, prevent abuse, and comply with legal obligations.
              We do not sell your personal information. We may share limited information with service providers
              such as Stripe (payments), Supabase (database hosting), and analytics providers, solely for the
              purpose of operating the Service.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Data retention</h2>
            <p>
              We retain your account data and audit history for as long as your account is active, or as needed
              to provide the Service and comply with legal obligations. If you delete your account, we will delete
              or anonymize your personal data within a reasonable time, except where we are required to retain it
              by law or for legitimate business purposes such as fraud prevention.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Your rights</h2>
            <p>
              Depending on your location, you may have rights under laws such as the GDPR or CCPA, including the
              right to access, correct, delete, or export your personal data, and the right to object to or restrict
              certain processing. To exercise these rights, contact us at{" "}
              <a href="mailto:support@optimizemysuite.com" className="text-primary hover:underline">
                support@optimizemysuite.com
              </a>
              . We will respond to verifiable requests in accordance with applicable law.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Security</h2>
            <p>
              We use industry-standard security measures, including encryption in transit, access controls, and
              secure hosting infrastructure, to protect your data. No system is completely secure, and we cannot
              guarantee absolute security.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will post the revised version on this page
              with an updated "Last updated" date. Continued use of the Service after changes constitutes acceptance
              of the revised policy.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Contact us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
              <a href="mailto:support@optimizemysuite.com" className="text-primary hover:underline">
                support@optimizemysuite.com
              </a>
              .
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
