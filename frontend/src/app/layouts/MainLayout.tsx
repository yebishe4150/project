import { Outlet, useLocation } from "react-router-dom"
import { Header } from "@/widgets/header/Header"
import { Footer } from "@/widgets/footer/Footer"
import styles from "./MainLayout.module.css"

export const MainLayout = () => {
  const location = useLocation()
  const isProfileRoute = /^\/profile\/[^/]+(?:\/me)?$/.test(location.pathname)

  return (
    <div className={styles.wrapper}>
      {!isProfileRoute && <Header />}

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
