import { useEffect, useState } from "react";
import { checkAuth } from "./auth";

export function useAuth() {
  const [isAuth, setIsAuth] = useState(null);

  useEffect(() => {
    checkAuth().then(setIsAuth);
  }, []);

  return {
    isAuth
  };
}