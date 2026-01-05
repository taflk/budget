import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./style.css";

createApp(App).use(router).mount("#app");

if ("serviceWorker" in navigator) {
  import("virtual:pwa-register").then(({ registerSW }) => {
    registerSW({ immediate: true });
  });
}
