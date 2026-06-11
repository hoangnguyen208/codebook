import type { Metadata } from "next";
import { Mona_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { EditorPreferencesProvider } from "@/components/settings/EditorPreferencesProvider";
import "./globals.css";

const monaSans = Mona_Sans({
  variable: "--font-mona-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CodeBook",
    template: "%s | CodeBook",
  },
  description: "Centralized developer knowledge hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${monaSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <EditorPreferencesProvider>
        {children}
        </EditorPreferencesProvider>
        <Toaster theme="dark" />
      </body>
    </html>
  );
}
