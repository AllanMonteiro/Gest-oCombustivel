import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import { FuelDataProvider } from "@/contexts/fuel/fuel-data-context";
import { queryClient } from "@/lib/query/query-client";
import { router } from "@/routes";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FuelDataProvider>
          <RouterProvider router={router} />
        </FuelDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}