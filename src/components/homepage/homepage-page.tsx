import { HomepageAiSection } from "./homepage-ai-section";
import { HomepageCta } from "./homepage-cta";
import { HomepageFeatures } from "./homepage-features";
import { HomepageFooter } from "./homepage-footer";
import { HomepageHero } from "./homepage-hero";
import { HomepageNav } from "./homepage-nav";
import { HomepagePricing } from "./homepage-pricing";
import styles from "./homepage.module.css";

interface HomepagePageProps {
  isSignedIn: boolean;
}

export function HomepagePage({ isSignedIn }: HomepagePageProps) {
  return (
    <main className={styles.page}>
      <div className={styles.pageShell}>
        <HomepageNav isSignedIn={isSignedIn} />
        <HomepageHero isSignedIn={isSignedIn} />
        <HomepageFeatures />
        <HomepageAiSection />
        <section className={styles.pricing} id="pricing">
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionTitle}>
              Simple, Transparent
              <br />
              <span className={styles.gradientText}>Pricing</span>
            </h2>
            <p className={`${styles.sectionSubtitle} ${styles.pricingSubtitle}`}>
              Start free. Upgrade when you need more power.
            </p>
            <HomepagePricing isSignedIn={isSignedIn} />
          </div>
        </section>
        <HomepageCta isSignedIn={isSignedIn} />
        <HomepageFooter />
      </div>
    </main>
  );
}
