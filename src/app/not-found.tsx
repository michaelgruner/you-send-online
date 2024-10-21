export const runtime = "edge";

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
  }
} as const;

export default function NotFound() {
  return (
    <>
      <title>404: This page could not be found.</title>
      <div style={styles.container}>
      <h1>YouSend.Online</h1>
      <p>404: This page could not be found.</p>
      </div>
    </>
  );
}
