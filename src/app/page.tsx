import styles from "./page.module.css";

import Users from "./Users";

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
        <Users />
      </div>
      <footer className={styles.footer}>
        <p>&copy; 2024. Made with &hearts; by <a href="mailto:me@mgruner.com">me@mgruner.com</a></p>
      </footer>
    </main>
  );
}
