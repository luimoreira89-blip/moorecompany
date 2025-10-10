import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

type AuthUser = { uid: string; email?: string; displayName?: string; photoURL?: string } | null;
type AuthState = { loggedIn: boolean; user: AuthUser };

function Bootstrap() {
  const [authState, setAuthState] = React.useState<AuthState>({ loggedIn: false, user: null });
  const [isReady, setIsReady] = React.useState(false);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AuthState>)?.detail;
      if (detail) {
        setAuthState(detail);
        setIsReady(true); // recebeu o 1º estado: tira o "Carregando…"
      }
    };
    window.addEventListener("firebase-auth-state-changed", handler as EventListener);

    // fallback: se nada chegar em 3s, mostra a UI mesmo assim
    const t = setTimeout(() => setIsReady(true), 3000);

    return () => {
      window.removeEventListener("firebase-auth-state-changed", handler as EventListener);
      clearTimeout(t);
    };
  }, []);

  if (!isReady) {
    return <div style={{ color: "#fff", textAlign: "center", marginTop: 80 }}>Carregando dados...</div>;
  }

  // Passa o estado de auth como prop opcional (se o App não usar, tudo bem)
  return <App authState={authState} />;
}

createRoot(document.getElementById("root")!).render(<Bootstrap />);
