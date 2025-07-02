import { createRouter, createWebHistory } from "vue-router";
import Login from "./views/Login.vue";

const routes = [{ path: "/", component: Login }];

export default createRouter({
  history: createWebHistory(),
  routes,
});
