import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Pricing } from "@/components/marketing/pricing";
import { Testimonials } from "@/components/marketing/testimonials";
import { Faq } from "@/components/marketing/faq";
import { Contact } from "@/components/marketing/contact";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

export const metadata: Metadata = {
  title: "SchoolPurse — Finance tracking for Zimbabwean schools",
  description:
    "Internal finance dashboard for school admin boards. Track cash payments, surface arrears, log expenses, and run monthly P&L without spreadsheets.",
  openGraph: {
    title: "SchoolPurse — Finance tracking for Zimbabwean schools",
    description:
      "Internal finance dashboard for school admin boards. Track cash payments, surface arrears, log expenses, and run monthly P&L without spreadsheets.",
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
        <Pricing />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <MarketingFooter />
    </>
  );
}
