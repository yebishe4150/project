import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./AuthProvider"
import { ToastProvider } from "./ToastProvider"

function shouldRetryQuery(failureCount: number, error: unknown) {
  if (failureCount >= 1) {
    return false
  }

  if (typeof error !== "object" || error === null) {
    return true
  }

  const status = "status" in error ? error.status : undefined

  if (typeof status === "number") {
    return status >= 500
  }

  return true
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetryQuery,
      refetchOnWindowFocus: false,
    },
  },
})

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    </ToastProvider>
  )
}
