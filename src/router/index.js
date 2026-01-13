import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import HomeView from "../views/HomeView.vue";
import BudgetView from "../views/BudgetView.vue";
import SettingsView from "../views/SettingsView.vue";
import CalendarView from "../views/CalendarView.vue";
import { getCurrentUser } from "../services/appwrite.js";

const routes = [
  { path: "/", redirect: "/home" },
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true },
  },
  { path: "/home", name: "home", component: HomeView },
  { path: "/budget", name: "budget", component: BudgetView },
  { path: "/calendar", name: "calendar", component: CalendarView },
  { path: "/settings", name: "settings", component: SettingsView },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  const user = await getCurrentUser();
  if (to.meta.public) {
    if (user && to.name === "login") {
      return { path: to.query.redirect || "/home" };
    }
    return true;
  }
  if (!user) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  return true;
});

export default router;
