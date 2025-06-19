import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import StableApp from "./StableApp";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <StableApp />
    </QueryClientProvider>
  </StrictMode>
);
