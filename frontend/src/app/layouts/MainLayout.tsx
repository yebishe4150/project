import { Outlet, useLocation } from "react-router-dom"
import { Header } from "@/widgets/header/Header"
import { Footer } from "@/widgets/footer/Footer"
import { DesktopSideNav } from "@/widgets/desktop-side-nav/DesktopSideNav"
import styles from "./MainLayout.module.css"

export const MainLayout = () => {
  const location = useLocation()
  const isProfileRoute = /^\/profile\/[^/]+(?:\/me)?$/.test(location.pathname)

  if (isProfileRoute) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.profileFrame}>
          <DesktopSideNav />

          <div className={styles.profileColumn}>
            <main className={styles.main}>
              <Outlet />
            </main>

            <Footer />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.wrapper}>
      <Header />

      <main className={styles.main}>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}
