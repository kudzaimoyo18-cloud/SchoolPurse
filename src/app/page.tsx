import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { LocalContext } from "@/components/marketing/local-context";
import { Partners } from "@/components/marketing/partners";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faq } from "@/components/marketing/faq";
import { Contact } from "@/components/marketing/contact";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "SchoolPurse — School fee management, from $35/month",
  description:
    "Run your school's fees, receipts and arrears from $35/month. Upgrade for an AI finance assistant, in-app class messaging, and automated WhatsApp fee reminders. Built for schools in Zimbabwe.",
  openGraph: {
    title: "SchoolPurse — School fee management, from $35/month",
    description:
      "Fees, receipts and arrears from $35/month. Upgrade for the AI assistant, in-app messaging and WhatsApp fee reminders. Built for Zimbabwean schools.",
    type: "website",
  },
};

export default async function Home() {
  // Detect auth state to swap the primary CTA between "Sign in" and
  // "Open dashboard" without forcing a redirect.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthed = !!user;

  return (
    <>
      <MarketingNav isAuthed={isAuthed} />
      <main>
        <Hero isAuthed={isAuthed} />
        <Features />
        <HowItWorks />
        <LocalContext />
        <Partners />
        <Pricing />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <MarketingFooter />
    </>
  );
}
