import { createContext } from "react"
import type { AuthContextType } from "@/features/auth/model/frontTypes"

export const AuthContext = createContext<AuthContextType | null>(null)
