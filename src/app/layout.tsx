import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ApolloProvider } from "@/components/providers/ApolloProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AppProvider } from "@/context/AppContext";
import { Auth0Provider } from "@/context/Auth0Context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Healthcare Worker Time Tracking System",
  description: "A comprehensive time tracking system for healthcare workers with location-based clock-in/clock-out",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Auth0Provider>
          <AppProvider>
            <ApolloProvider>
              <ThemeProvider>
                {children}
              </ThemeProvider>
            </ApolloProvider>
          </AppProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
