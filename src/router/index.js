import { createRouter, createWebHistory } from "vue-router";
import Chat from "/src/components/Chat.vue";
import Motivation from "/src/components/Motivation.vue";
import Orthographe from "/src/components/Orthographe.vue";

const routes = [
    { path: "/", component: Chat },
    { path: "/lettre", component: Motivation },
    { path: "/orthographe", component: Orthographe },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;