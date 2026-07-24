import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { HeaderBrand } from "@/components/layout/HeaderBrand";
import { SEO } from "@/components/SEO";

export default function Terms() {
  const lastUpdated = "July 24, 2026";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Terms of Service — OptimizeMySuite"
        description="OptimizeMySuite terms of service: subscription terms, acceptable use, and disclaimers."
        canonicalPath="/terms"
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
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-10">
            Last updated: {lastUpdated}
          </p>

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground/80">
            <p>
              These Terms of Service ("Terms") govern your access to and use of OptimizeMySuite
              ("Service"), a website audit and reporting platform operated by OptimizeMySuite from
              Florida, USA. By creating an account, using the Service, or submitting a website for
              analysis, you agree to these Terms.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">1. The Service</h2>
            <p>
              OptimizeMySuite provides automated website audits, scoring, and white-label reports for
              marketing agencies, SEO consultants, and web design professionals. Reports are generated
              from publicly available website data and algorithmic analysis. Scores and findings are
              informational and are not a substitute for professional legal, technical, or financial
              advice.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">2. Accounts and subscriptions</h2>
            <p>
              You must provide accurate information when creating an account. You are responsible for
              maintaining the security of your account credentials.
            </p>
            <p>
              Subscription billing is handled through Stripe. By subscribing, you authorize us to charge
              your payment method on a recurring basis according to the plan you select. We offer a 3-day
              free trial on eligible plans. If you do not cancel before the trial ends, your subscription
              will begin and you will be charged.
            </p>
            <p>
              You may cancel your subscription at any time through your account settings or the Stripe
              customer portal. Cancellation takes effect at the end of the current billing period. No
              refunds are provided for partial billing periods unless required by law.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">3. Acceptable use</h2>
            <p>
              You may only use the Service to audit websites for which you have a legitimate business
              interest, such as your own properties, your clients' properties, or prospective clients you
              are evaluating. You may not use the Service to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>audit websites you have no legitimate interest in;</li>
              <li>abuse free audits, lead-capture features, or trial periods;</li>
              <li>circumvent rate limits, access controls, or subscription restrictions;</li>
              <li>harass, defame, or harm third parties;</li>
              <li>violate applicable laws or regulations.</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that violate these rules or place
              undue strain on the Service.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">4. Intellectual property</h2>
            <p>
              You retain ownership of any content you submit to the Service, including the website URLs
              you audit and any custom branding you upload. You grant us a limited license to process that
              content solely for the purpose of providing the Service. Reports generated for your account
              may be used and distributed by you in accordance with your subscription plan.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">5. Disclaimers</h2>
            <p>
              The Service and any reports are provided "as is" without warranties of any kind. Scores,
              recommendations, and implementation packs are generated automatically and are intended as
              informational analysis only. We do not guarantee that any specific score will improve,
              that a report will be error-free, or that following recommendations will produce any particular
              business outcome.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">6. Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, OptimizeMySuite and its operators will not be liable
              for any indirect, incidental, special, consequential, or punitive damages, or for any loss
              of profits, revenue, data, or business opportunities arising out of or related to your use
              of the Service. Our total liability will not exceed the amount you paid us in the 12 months
              preceding the event giving rise to liability.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">7. Changes to these terms</h2>
            <p>
              We may update these Terms from time to time. We will post the revised version on this page
              with an updated "Last updated" date. Material changes will be communicated to account holders
              by email or through the Service. Continued use of the Service after changes constitutes
              acceptance of the revised Terms.
            </p>

            <h2 className="text-xl font-semibold text-foreground mt-8 mb-3">8. Governing law and contact</h2>
            <p>
              These Terms are governed by the laws of the State of Florida, USA, without regard to conflict
              of laws principles. For any questions about these Terms, please contact us at{" "}
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
