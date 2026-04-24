import Link from "next/link";

import { cn } from "@/lib/utils";

import styles from "./homepage.module.css";

interface HomepageCtaProps {
  isSignedIn: boolean;
}

export function HomepageCta({ isSignedIn }: HomepageCtaProps) {
  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const primaryLabel = isSignedIn ? "Open Dashboard" : "Get Started Free";
  const supportItems = ["Search everything fast", "Keep AI prompts reusable", "Store notes with code"];

  return (
    <section className={styles.ctaSection}>
      <div className={styles.sectionInner}>
        <h2 className={styles.sectionTitle}>
          Ready to Organize Your
          <br />
          <span className={styles.gradientText}>Developer Knowledge?</span>
        </h2>
        <p className={`${styles.sectionSubtitle} ${styles.ctaSubtitle}`}>
          Join thousands of developers who stopped losing their best work.
        </p>
        <div className={styles.ctaProofGrid}>
          {supportItems.map((item) => (
            <div key={item} className={styles.ctaProofItem}>
              {item}
            </div>
          ))}
        </div>
        <Link href={primaryHref} className={cn(styles.btn, styles.btnPrimary, styles.btnLg)}>
          {primaryLabel}
        </Link>
      </div>
    </section>
  );
}
