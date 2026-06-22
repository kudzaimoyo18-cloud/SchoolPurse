import type { MetadataRoute } from "next";

// Web App Manifest — makes SchoolPurse installable (Add to Home Screen) and is
// the foundation for the Play Store TWA + iOS Capacitor wrappers. Next serves
// this at /manifest.webmanifest and injects <link rel="manifest"> automatically.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SchoolPurse — School Finance",
    short_name: "SchoolPurse",
    description:
      "Run your school's fees, receipts and arrears. Record payments, chase arrears, and (on the AI plan) ask your finances and send WhatsApp reminders.",
    start_url: "/app/overview",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#102a43",
    theme_color: "#102a43",
    categories: ["finance", "education", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
