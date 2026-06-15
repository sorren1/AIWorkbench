/* ============================================================
   AI Delivery Workbench — Root app + router
   ============================================================ */
function Screen() {
  const { state } = useApp();
  switch (state.route) {
    case "queue": return <WorkQueue />;
    case "issue": return <IssueDetail />;
    case "artifacts": return <ArtifactsScreen />;
    case "github": return <GitHubScreen />;
    case "validation": return <ValidationScreen />;
    case "architecture": return <ArchitectureScreen />;
    case "settings": return <SettingsScreen />;
    default: return <WorkQueue />;
  }
}

function Footer() {
  return (
    <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 26px 28px" }}>
      <div className="wb-flex wb-wrap" style={{ gap: 10, padding: "14px 0 0", borderTop: "1px solid var(--border-subtle)", color: "var(--text-tertiary)", fontSize: 12 }}>
        <Icon name="shield-check" size={14} />
        <span>{window.WBData.meta.aboutNote}</span>
        <span className="wb-spacer" style={{ marginLeft: "auto" }} />
        <span className="wb-mono">{window.WBData.meta.product} · v{window.WBData.meta.version}</span>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useTheme();
  return (
    <div className="wb-app">
      <Sidebar />
      <div className="wb-main">
        <Header theme={theme} setTheme={setTheme} />
        <div className="wb-content cr-scroll">
          <Screen />
          <Footer />
        </div>
      </div>
      <ToastHost />
      <DrawerHost />
      <ModalHost />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppProvider><App /></AppProvider>
);
