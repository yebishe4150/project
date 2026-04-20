// src/app/providers.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./AuthProvider";

const queryClient = new QueryClient()

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
     <AuthProvider>
      <QueryClientProvider client={queryClient}>
       {children}
      </QueryClientProvider>
    </AuthProvider>
  )
}