"use client";

import { useState } from "react";
import Link from "next/link";

function CodeBookLogo() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 28 28"
      fill="none"
      className="shrink-0"
    >
      <rect width="28" height="28" rx="6" className="fill-blue-500" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        className="fill-white font-mono text-xs font-bold select-none"
      >
        &lt;/&gt;
      </text>
    </svg>
  );
}

const productLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Changelog", href: "#" },
];

const resourceLinks = [
  { label: "Docs", href: "#" },
  { label: "API", href: "#" },
  { label: "Blog", href: "#" },
];

const companyLinks = [
  { label: "About", href: "#" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  const [year] = useState(() => new Date().getFullYear());

  return (
    <footer className="border-t border-border/40 px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <CodeBookLogo />
              <span className="text-sm font-semibold">CodeBook</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-xs">
              Your developer knowledge, organized.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </h4>
            <ul className="mt-3 space-y-2">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Resources
            </h4>
            <ul className="mt-3 space-y-2">
              {resourceLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h4>
            <ul className="mt-3 space-y-2">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border/40 pt-6 text-center">
          <p
            className="text-xs text-muted-foreground"
            suppressHydrationWarning
          >
            &copy; {year} CodeBook. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
