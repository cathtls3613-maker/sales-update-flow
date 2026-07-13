"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/summary", label: "Summary" },
  { href: "/crm-checklist", label: "CRM Checklist" },
];

export default function Nav() {
  const pathname = usePathname();
  return (
    <header className="border-b border-neutral-200 bg-white">
      <nav className="mx-auto flex max-w-6xl items-center gap-1 px-4 py-3">
        <Link href="/" className="mr-4 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600 text-sm font-bold text-white">
            S
          </span>
          <span className="text-sm font-semibold tracking-tight text-neutral-900">
            Sales Update Flow
          </span>
        </Link>
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
              pathname === href
                ? "bg-indigo-50 text-indigo-700"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
