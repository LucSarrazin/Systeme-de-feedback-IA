<script setup>
import { ref } from 'vue';

// Gestion du menu responsive
const menuOpen = ref(false);
</script>

<template>
  <header>
    <nav>
      <div class="nav-container">
        <!-- Logo -->
        <div class="logo">🌟 Feedback IA</div>

        <!-- Bouton menu burger (mobile) -->
        <button class="burger-menu" @click="menuOpen = !menuOpen">
          ☰
        </button>

        <!-- Liens de navigation -->
        <div :class="['nav-links', { 'active': menuOpen }]">
          <router-link to="/" @click="menuOpen = false">Analyse de phrase</router-link>
          <router-link to="/lettre" @click="menuOpen = false">Lettre de motivation</router-link>
        </div>
      </div>
    </nav>
  </header>

  <main>
    <router-view />
  </main>
</template>

<style scoped>
/* === NAVBAR === */
nav {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(135deg, #007bff, #0056b3);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  padding: 12px 20px;
  z-index: 1000;
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.logo {
  font-size: 1.6rem;
  font-weight: bold;
  color: white;
  user-select: none;
}

/* === Liens de navigation === */
.nav-links {
  display: flex;
  gap: 20px;
}

.nav-links a {
  color: white;
  text-decoration: none;
  font-size: 1rem;
  font-weight: bold;
  padding: 10px 15px;
  transition: background 0.3s ease-in-out, transform 0.2s;
  border-radius: 5px;
}

.nav-links a:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.nav-links a.router-link-active {
  background: rgba(255, 255, 255, 0.3);
}

/* === MENU BURGER (Mobile) === */
.burger-menu {
  display: none;
  background: none;
  border: none;
  font-size: 2rem;
  color: white;
  cursor: pointer;
}

/* === RESPONSIVE === */
@media (max-width: 768px) {
  .burger-menu {
    display: block;
  }

  .nav-links {
    display: none;
    flex-direction: column;
    position: absolute;
    top: 55px;
    left: 0;
    width: 100%;
    background: rgba(0, 91, 187, 0.95);
    padding: 15px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
  }

  .nav-links.active {
    display: flex;
  }

  .nav-links a {
    padding: 15px;
    font-size: 1.1rem;
  }
}

/* === MAIN CONTENT === */

main {
  position: absolute; /* Permet de centrer précisément */
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%); /* Centre vraiment */
  width: 80vw; /* Prend 80% de l'écran en largeur */
  max-width: 800px; /* Ne dépasse pas cette taille */
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto; /* Pour gérer les longs contenus */
  max-height: 90vh; /* Ne dépasse pas l’écran en hauteur */
}





</style>
