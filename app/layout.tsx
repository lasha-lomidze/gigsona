import "./global.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "../components/Navbar";
import { Overlay } from "../components/Overlay";
import { SignIn } from "@/components/SignIn";
import { SignUp } from "@/components/SignUp";
import { DisplayScaleProvider } from "@/components/DisplayScaleSetting";
import { RegionProvider } from "@/components/RegionSetting";
import { ThemeProvider } from "@/components/ThemeSetting";
import { MotionProvider } from "@/components/MotionProvider";
import { RouteTransition } from "@/components/RouteTransition";
import { getT } from "@/lib/i18n/server";
import { getRegion } from "@/lib/region-server";
import { getRegionOption } from "@/lib/region";
import { getThemePreference } from "@/lib/theme-server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();

  return {
    title: t("shell.meta.title"),
    description: t("shell.meta.description"),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [region, themePreference] = await Promise.all([
    getRegion(),
    getThemePreference(),
  ]);

  const initialThemeClass = themePreference === "light" ? "light" : "dark";

  return (
    <html
      lang={getRegionOption(region).locale}
      className={`${geistSans.variable} ${geistMono.variable} ${initialThemeClass} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var key="gigsona:theme";var stored=localStorage.getItem(key);var pref=stored||"${themePreference}";var isLight=pref==="light"||(pref==="system"&&window.matchMedia("(prefers-color-scheme: light)").matches);var root=document.documentElement;if(isLight){root.classList.add("light");root.classList.remove("dark");root.style.colorScheme="light";}else{root.classList.add("dark");root.classList.remove("light");root.style.colorScheme="dark";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.className} app-shell flex bg-canvas text-ink`}>
        <MotionProvider>
          <ThemeProvider initialPreference={themePreference}>
            <DisplayScaleProvider>
              <RegionProvider initialRegion={region}>
                <Navbar />
                <Overlay />
                <SignIn />
                <SignUp />
                <main className="app-main relative min-w-0 flex-1 overflow-y-auto px-4 pb-6 pt-[calc(5rem+env(safe-area-inset-top))] md:p-8">
                  <RouteTransition className="relative mx-auto max-w-5xl space-y-6 pb-8 md:pb-16">
                    {children}
                  </RouteTransition>
                </main>
              </RegionProvider>
            </DisplayScaleProvider>
          </ThemeProvider>
        </MotionProvider>
      </body>
    </html>
  );
}
