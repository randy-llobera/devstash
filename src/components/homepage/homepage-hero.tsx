import Link from "next/link";

import { cn } from "@/lib/utils";

import { HomepageChaosAnimation } from "./homepage-chaos-animation";
import styles from "./homepage.module.css";

interface HomepageHeroProps {
  isSignedIn: boolean;
}

export function HomepageHero({ isSignedIn }: HomepageHeroProps) {
  const primaryHref = isSignedIn ? "/dashboard" : "/register";
  const primaryLabel = isSignedIn ? "Open Dashboard" : "Get Started Free";

  return (
    <section className={styles.hero}>
      <div className={styles.heroText}>
        <h1 className={styles.heroTitle}>
          Stop Losing Your
          <br />
          <span className={styles.gradientText}>Developer Knowledge</span>
        </h1>
        <p className={styles.heroSubtitle}>
          Your snippets, prompts, commands, and notes are scattered across Notion, GitHub, Slack,
          and a dozen browser tabs. DevStash brings them all into one fast, searchable hub.
        </p>
        <div className={styles.heroCtas}>
          <Link href={primaryHref} className={cn(styles.btn, styles.btnPrimary, styles.btnLg)}>
            {primaryLabel}
          </Link>
          <a href="#features" className={cn(styles.btn, styles.btnGhost, styles.btnLg)}>
            See Features
          </a>
        </div>
      </div>

      <HomepageChaosAnimation />
    </section>
  );
}
