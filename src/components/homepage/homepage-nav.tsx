"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import { HomepageLogo } from "./homepage-logo";
import styles from "./homepage.module.css";

interface HomepageNavProps {
  isSignedIn: boolean;
}

export function HomepageNav({ isSignedIn }: HomepageNavProps) {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    onScroll();
    window.addEventListener("scroll", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const ghostHref = isSignedIn ? "/dashboard" : "/sign-in";
  const ghostLabel = isSignedIn ? "Dashboard" : "Sign In";
  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const primaryLabel = isSignedIn ? "Open Dashboard" : "Get Started";

  const closeMenu = () => setMobileOpen(false);

  return (
    <nav className={cn(styles.navbar, scrolled && styles.scrolled)}>
      <div className={styles.navInner}>
        <HomepageLogo />
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className={styles.navActions}>
          <Link href={ghostHref} className={cn(styles.btn, styles.btnGhost)}>
            {ghostLabel}
          </Link>
          <Link href={primaryHref} className={cn(styles.btn, styles.btnPrimary)}>
            {primaryLabel}
          </Link>
        </div>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((current) => !current)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {mobileOpen ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>
      <div className={cn(styles.mobileMenu, mobileOpen && styles.mobileMenuOpen)}>
        <a href="#features" onClick={closeMenu}>
          Features
        </a>
        <a href="#pricing" onClick={closeMenu}>
          Pricing
        </a>
        <Link href={ghostHref} className={cn(styles.btn, styles.btnGhost)} onClick={closeMenu}>
          {ghostLabel}
        </Link>
        <Link href={primaryHref} className={cn(styles.btn, styles.btnPrimary)} onClick={closeMenu}>
          {primaryLabel}
        </Link>
      </div>
    </nav>
  );
}
