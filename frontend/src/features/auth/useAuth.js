import { useQuery } from "@tanstack/react-query";
import { checkAuth } from "./auth";

export function useAuth() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["auth-status"],
    queryFn: checkAuth,
    retry: false,
  });

  return {
    isAuth: isLoading ? null : isError ? false : (data ?? false),
  };
}
