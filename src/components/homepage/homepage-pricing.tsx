"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

import styles from "./homepage.module.css";

interface HomepagePricingProps {
  isSignedIn: boolean;
}

const freeFeatures = [
  { label: "50 items", disabled: false },
  { label: "3 collections", disabled: false },
  { label: "Snippets, Prompts, Commands, Notes, Links", disabled: false },
  { label: "Basic search", disabled: false },
  { label: "File & Image uploads", disabled: true },
  { label: "AI features", disabled: true },
] as const;

const proFeatures = [
  { label: "Unlimited items" },
  { label: "Unlimited collections" },
  { label: "All item types including Files & Images" },
  { label: "AI auto-tagging & summaries" },
  { label: 'AI "Explain This Code"' },
  { label: "Data export (JSON/ZIP)" },
] as const;

export function HomepagePricing({ isSignedIn }: HomepagePricingProps) {
  const [isYearly, setIsYearly] = React.useState(false);

  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const freeLabel = isSignedIn ? "Open Dashboard" : "Get Started";
  const proLabel = isSignedIn ? "Open Dashboard" : "Start Free Trial";

  return (
    <>
      <div className={styles.pricingToggle}>
        <span className={cn(styles.toggleLabel, !isYearly && styles.toggleLabelActive)}>
          Monthly
        </span>
        <button
          type="button"
          className={cn(styles.toggleSwitch, isYearly && styles.toggleSwitchYearly)}
          aria-label="Toggle billing period"
          onClick={() => setIsYearly((current) => !current)}
        >
          <span className={styles.toggleKnob} />
        </button>
        <span className={cn(styles.toggleLabel, isYearly && styles.toggleLabelActive)}>
          Yearly <span className={styles.saveBadge}>Save 25%</span>
        </span>
      </div>

      <div className={styles.pricingGrid}>
        <div className={styles.pricingCard}>
          <div className={styles.pricingHeader}>
            <h3>Free</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>$0</span>
              <span className={styles.pricePeriod}>/month</span>
            </div>
            <p className={styles.pricingDesc}>Perfect for getting started</p>
          </div>
          <ul className={styles.pricingFeatures}>
            {freeFeatures.map((feature) => (
              <li
                key={feature.label}
                className={feature.disabled ? styles.pricingFeatureDisabled : undefined}
              >
                {feature.disabled ? <DisabledIcon /> : <CheckIcon />}
                {feature.label}
              </li>
            ))}
          </ul>
          <Link href={primaryHref} className={cn(styles.btn, styles.btnGhost, styles.btnBlock)}>
            {freeLabel}
          </Link>
        </div>

        <div className={cn(styles.pricingCard, styles.pricingCardPro)}>
          <span className={styles.popularBadge}>Most Popular</span>
          <div className={styles.pricingHeader}>
            <h3>Pro</h3>
            <div className={styles.price}>
              <span className={styles.priceAmount}>{isYearly ? "$6" : "$8"}</span>
              <span className={styles.pricePeriod}>
                {isYearly ? "/month (billed $72/yr)" : "/month"}
              </span>
            </div>
            <p className={styles.pricingDesc}>For serious developers</p>
          </div>
          <ul className={styles.pricingFeatures}>
            {proFeatures.map((feature) => (
              <li key={feature.label}>
                <CheckIcon />
                {feature.label}
              </li>
            ))}
          </ul>
          <Link href={primaryHref} className={cn(styles.btn, styles.btnPrimary, styles.btnBlock)}>
            {proLabel}
          </Link>
        </div>
      </div>
    </>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DisabledIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
