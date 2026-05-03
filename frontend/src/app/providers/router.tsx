import { createBrowserRouter } from "react-router-dom"
import { FeedPage } from "../../pages/feed/FeedPage"
import { PrivateProfilePage } from "../../pages/profile/PrivateProfilePage"
import { PublicProfilePage } from "../../pages/profile/PublicProfilePage"
import { MainLayout } from "../layouts/MainLayout"

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <FeedPage />,
      },
      {
        path: "/profile/:nickname",
        element: <PublicProfilePage />,
      },
      {
        path: "/profile/:nickname/me",
        element: <PrivateProfilePage />,
      },
    ],
  },
])
