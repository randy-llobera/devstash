import Link from "next/link";

import { HomepageLogo } from "./homepage-logo";
import styles from "./homepage.module.css";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Collections", href: "/collections" },
      { label: "Favorites", href: "/favorites" },
      { label: "Settings", href: "/settings" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Sign In", href: "/sign-in" },
      { label: "Register", href: "/register" },
      { label: "Profile", href: "/profile" },
    ],
  },
] as const;

export function HomepageFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <HomepageLogo />
            <p>Your developer knowledge hub. One place for snippets, prompts, commands, and more.</p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title} className={styles.footerCol}>
              <h4>{column.title}</h4>
              {column.links.map((link) =>
                link.href.startsWith("#") ? (
                  <a key={link.label} href={link.href}>
                    {link.label}
                  </a>
                ) : (
                  <Link key={link.label} href={link.href}>
                    {link.label}
                  </Link>
                ),
              )}
            </div>
          ))}
        </div>

        <div className={styles.footerBottom}>
          <p>© {new Date().getFullYear()} DevStash. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
