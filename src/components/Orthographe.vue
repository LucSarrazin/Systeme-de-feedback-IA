<script setup>
import { ref, computed } from "vue";
import { Mistral } from "@mistralai/mistralai";

// Clé API (à sécuriser en production via .env)
const apiKey = "JDPqSnYb8vlOnUPwnnFjz7Roq1VlL6bi";
const client = new Mistral({ apiKey });

const userMessage = ref("");
const response = ref("");
const rawResponse = ref("");
const isLoading = ref(false);

const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  isLoading.value = true;
  rawResponse.value = "";

  try {
    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{
        role: "user",
        content: `Analyse la phrase fournie et corrige là en respectant ces règles :

  Corriger la phrase fournie en respectant ces règles.
  - Ne donne aucun conseil, remarque ou note explicative.
  - Ne commence pas par "Bien sûr," ni aucune formule similaire.
  - Génère uniquement le texte corriger, sans ajouter de commentaires.
 voici la phrase de l'utilisateur : ${userMessage.value}".`
      }]
    });
    chatResponse.value = chatResponse.choices[0].message.content;
    console.log("✏️ Phrase corrigée générée :", chatResponse.value);
    response.value = chatResponse.choices[0].message.content;
    isLoading.value = false;
  } catch (error) {
    isLoading.value = false;
    response.value = "Erreur de génération de la lettre :" + error;
    console.error("❌ Erreur de génération de la lettre :", error);
  }
};

</script>

<template>
  <div class="chat-container">
    <h2>✏️ Correcteur Orthographique / Grammaire</h2>

    <!-- Champ de saisie et bouton -->
    <div class="input-container">
      <input
          v-model="userMessage"
          placeholder="Entrez une phrase à corriger..."
          aria-label="Saisissez une phrase"
      />
      <button @click="sendMessage" :disabled="isLoading">
        {{ isLoading ? "Analyse en cours..." : "Analyser" }}
      </button>
    </div>

    <!-- Animation de chargement -->
    <div v-if="isLoading" class="loading">⏳ Analyse en cours...</div>


    <!-- Affichage de la phrase corrigée -->
    <div v-if="response" class="output">
      <h3 style="color: black">✏️ Phrase corrigée :</h3>
      <pre>{{ response }}</pre>
    </div>

    <!-- Message d'erreur si problème -->
    <div v-if="response.includes('❌ Erreur')" class="error-message">
      {{ response }}
    </div>

  </div>
</template>

<style>
/* Conteneur principal */
.chat-container {
  max-width: 800px;
  margin: 50px auto;
  padding: 25px;
  background: #ffffff;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  text-align: center;
}

/* Titre */
h2 {
  color: #333;
  font-size: 24px;
  margin-bottom: 20px;
}

/* Champ de saisie et bouton */
.input-container {
  display: flex;
  gap: 10px;
  justify-content: center;
}

input {
  padding: 12px;
  border: 2px solid #007bff;
  border-radius: 8px;
  width: 70%;
  font-size: 16px;
  transition: border-color 0.3s ease-in-out;
}

input:focus {
  border-color: #0056b3;
  outline: none;
}

button {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: bold;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* Animation de chargement */
.loading {
  margin-top: 15px;
  font-size: 16px;
  font-weight: bold;
  color: #007bff;
}

pre {
  background: #f4f4f4;
  color: #333;
  padding: 12px;
  border-radius: 5px;
  max-width: 100%;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 14px;
}

/* Message d'erreur */
.error-message {
  margin-top: 15px;
  font-size: 16px;
  font-weight: bold;
  color: red;
}

/* Responsive */
@media (max-width: 768px) {
  .chat-container {
    width: 90%;
    padding: 15px;
  }

  .input-container {
    flex-direction: column;
    gap: 5px;
  }

  input {
    width: 100%;
  }

  button {
    width: 100%;
  }

  pre {
    font-size: 13px;
  }
}
</style>