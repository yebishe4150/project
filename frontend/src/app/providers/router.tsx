import { createBrowserRouter } from "react-router-dom"
import { FeedPage } from "../../pages/feed/FeedPage"
import { MainLayout } from "../layouts/MainLayout"

export const router = createBrowserRouter([
  {
    element: <MainLayout />,
    children: [
      {
        path: "/",
        element: <FeedPage />,
      },
    ],
  },
])