import { createRouter, createWebHistory } from "vue-router";
import Chat from "/src/components/Chat.vue";
import Motivation from "/src/components/Motivation.vue";

const routes = [
    { path: "/", component: Chat },
    { path: "/lettre", component: Motivation },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;