import { createRouter, createWebHistory } from "vue-router";
import Chat from "/src/components/Chat.vue";
import Motivation from "/src/components/Motivation.vue";
import Orthographe from "/src/components/Orthographe.vue";
import Extraction from "/src/components/DonneeCV.vue";
import MultipleCV from "/src/components/MultipleCV.vue";

const routes = [
    { path: "/", component: Chat },
    { path: "/lettre", component: Motivation },
    { path: "/orthographe", component: Orthographe },
    { path: "/extraction", component: Extraction },
    { path: "/multipleCV", component: MultipleCV },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;