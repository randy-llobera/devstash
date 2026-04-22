import styles from "./homepage.module.css";

const checklist = [
  "Auto-tag suggestions based on content",
  "AI-generated summaries for long snippets",
  "Explain This Code one-click breakdowns",
  "Prompt optimizer for better AI results",
] as const;

const codeLines = [
  {
    line: "1",
    content: (
      <>
        <span className={styles.kw}>export</span> <span className={styles.kw}>function</span>{" "}
        <span className={styles.fn}>useDebounce</span>
        <span className={styles.p}>&lt;</span>
        <span className={styles.tp}>T</span>
        <span className={styles.p}>&gt;(</span>
      </>
    ),
  },
  {
    line: "2",
    content: (
      <>
        <span className={styles.param}>value</span>: <span className={styles.tp}>T</span>,
      </>
    ),
  },
  {
    line: "3",
    content: (
      <>
        <span className={styles.param}>delay</span>: <span className={styles.tp}>number</span>
      </>
    ),
  },
  {
    line: "4",
    content: (
      <>
        <span className={styles.p}>):</span> <span className={styles.tp}>T</span>{" "}
        <span className={styles.p}>{"{"}</span>
      </>
    ),
  },
  {
    line: "5",
    content: (
      <>
        <span className={styles.kw}>const</span> [debounced, setDebounced] =
      </>
    ),
  },
  {
    line: "6",
    content: (
      <>
        <span className={styles.fn}>useState</span>
        <span className={styles.p}>(</span>
        <span className={styles.param}>value</span>
        <span className={styles.p}>);</span>
      </>
    ),
  },
  { line: "7", content: <></> },
  {
    line: "8",
    content: (
      <>
        <span className={styles.fn}>useEffect</span>
        <span className={styles.p}>{"(() => {"}</span>
      </>
    ),
  },
  {
    line: "9",
    content: (
      <>
        <span className={styles.kw}>const</span> t = <span className={styles.fn}>setTimeout</span>
        <span className={styles.p}>{"(() =>"}</span>
      </>
    ),
  },
  {
    line: "10",
    content: (
      <>
        <span className={styles.fn}>setDebounced</span>
        <span className={styles.p}>(</span>
        <span className={styles.param}>value</span>
        <span className={styles.p}>),</span> <span className={styles.param}>delay</span>
        <span className={styles.p}>);</span>
      </>
    ),
  },
  {
    line: "11",
    content: (
      <>
        <span className={styles.kw}>return</span> <span className={styles.p}>{"() =>"}</span>{" "}
        <span className={styles.fn}>clearTimeout</span>
        <span className={styles.p}>(t);</span>
      </>
    ),
  },
  {
    line: "12",
    content: (
      <>
        <span className={styles.p}>{"}, ["}</span>
        <span className={styles.param}>value</span>, <span className={styles.param}>delay</span>
        <span className={styles.p}>{" ]);"}</span>
      </>
    ),
  },
  { line: "13", content: <></> },
  {
    line: "14",
    content: (
      <>
        <span className={styles.kw}>return</span> debounced;
      </>
    ),
  },
  {
    line: "15",
    content: <span className={styles.p}>{"}"}</span>,
  },
] as const;

export function HomepageAiSection() {
  return (
    <section className={styles.aiSection} id="ai">
      <div className={styles.sectionInner}>
        <div className={styles.aiGrid}>
          <div>
            <span className={styles.proBadge}>Pro Feature</span>
            <h2 className={styles.sectionTitle}>
              AI-Powered
              <br />
              <span className={styles.gradientText}>Productivity</span>
            </h2>
            <p className={`${styles.sectionSubtitle} ${styles.aiSectionSubtitle}`}>
              Let AI handle the busywork so you can focus on building.
            </p>
            <ul className={styles.aiChecklist}>
              {checklist.map((item) => (
                <li key={item}>
                  <CheckIcon />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.codeMockup}>
            <div className={styles.codeHeader}>
              <div className={styles.codeDots}>
                <span className={`${styles.dot} ${styles.dotRed}`} />
                <span className={`${styles.dot} ${styles.dotYellow}`} />
                <span className={`${styles.dot} ${styles.dotGreen}`} />
              </div>
              <span className={styles.codeLang}>typescript</span>
            </div>
            <div className={styles.codeBody}>
              {codeLines.map((line) => (
                <div key={line.line} className={styles.codeLine}>
                  <span className={styles.lineNum}>{line.line}</span>
                  {line.content}
                </div>
              ))}
            </div>
            <div className={styles.aiTags}>
              <span className={styles.aiTagsLabel}>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                </svg>
                AI Generated Tags
              </span>
              <div className={styles.aiTagList}>
                {["react", "hooks", "debounce", "typescript", "performance"].map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
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
