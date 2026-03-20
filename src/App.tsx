import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import { FuelDataProvider } from "@/contexts/fuel/fuel-data-context";
import { InventoryDataProvider } from "@/contexts/inventory/inventory-data-context";
import { queryClient } from "@/lib/query/query-client";
import { router } from "@/routes";

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FuelDataProvider>
          <InventoryDataProvider>
            <RouterProvider router={router} />
          </InventoryDataProvider>
        </FuelDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
