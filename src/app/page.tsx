import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
      <div className={styles.title}>
      <h1>
        YouSend.Online
    </h1>
      <p>
      Send files between devices instantly and securely
    </p>
      </div>
      <ul className={styles.users}>
      <li>User 1</li>
      <li>User 2</li>
      </ul>
      </div>
      <footer className={styles.footer}>
      <p>&copy; 2024. Made with &hearts; by <a href="mailto:me@mgruner.com">me@mgruner.com</a></p>
      </footer>
    </main>
  );
}
