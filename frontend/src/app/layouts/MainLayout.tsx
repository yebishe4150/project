import { Outlet } from "react-router-dom"
import { Header } from "@/widgets/header/Header"
import { Footer } from "@/widgets/footer/Footer"
import styles from "./MainLayout.module.css"

export const MainLayout = () => {
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