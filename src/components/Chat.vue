<script setup>
import { ref, computed } from "vue";
import { Mistral } from "@mistralai/mistralai";

// Clé API (à sécuriser en production via .env)
const apiKey = "JDPqSnYb8vlOnUPwnnFjz7Roq1VlL6bi";
const client = new Mistral({ apiKey });

const userMessage = ref("");
const responseJson = ref(null);
const rawResponse = ref("");
const isLoading = ref(false);

// Fonction pour extraire le JSON de la réponse brute
const extractJson = (text) => {
  // Recherche le contenu entre ```json et ```
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  return jsonMatch ? jsonMatch[1] : null;
};

const sendMessage = async () => {
  if (!userMessage.value.trim()) return;

  isLoading.value = true;
  responseJson.value = null;
  rawResponse.value = "";

  try {
    const chatResponse = await client.chat.complete({
      model: "mistral-large-latest",
      messages: [{
        role: "user",
        content: `Analyse la phrase fournie et retourne uniquement un JSON respectant strictement cette structure :
{
  "syntaxe": {
    "phrases": [
      {
        "mot": "exemple",
        "type": "exemple"
      }
    ]
  },
  "sémantique": {
    "contexte": "exemple",
    "signification": {
      "exemple": "exemple"
    },
    "intention": "exemple"
  }
}
Remplace "exemple" par les valeurs correspondant à la phrase : "${userMessage.value}". Ne retourne rien d'autre que le JSON.`
      }]
    });

    // Récupère la réponse brute de l'IA
    rawResponse.value = chatResponse.choices[0].message.content;
    console.log("🔹 Réponse brute de l'IA :", rawResponse.value);

    // Extrait le JSON de la réponse
    const extracted = extractJson(rawResponse.value);
    if (extracted) {
      responseJson.value = JSON.parse(extracted);
    } else {
      throw new Error("Impossible d'extraire le JSON de la réponse.");
    }
  } catch (error) {
    console.error("❌ Erreur API Mistral:", error);
    responseJson.value = { error: "Impossible d'analyser la phrase." };
  } finally {
    isLoading.value = false;
  }
};

// Computed pour reconstruire la phrase syntaxique (facultatif)
const fullPhrase = computed(() => {
  if (responseJson.value && responseJson.value.syntaxe) {
    return responseJson.value.syntaxe.phrase || userMessage.value;
  }
  return "";
});
</script>

<template>
  <div class="chat-container">
    <input v-model="userMessage" placeholder="Entrez une phrase à analyser..." />
    <button @click="sendMessage" :disabled="isLoading">
      {{ isLoading ? "Analyse en cours..." : "Analyser" }}
    </button>

    <!-- Affichage de la réponse brute pour débogage -->
    <!--<div v-if="rawResponse">
      <h4>Réponse brute :</h4>
      <pre>{{ rawResponse }}</pre>
    </div>-->

    <div v-if="responseJson && !responseJson.error">
      <!-- TABLEAU ANALYSE SYNTAXIQUE -->
      <h3>📌 Analyse Syntaxique</h3>
      <table>
        <thead>
        <tr>
          <th>Phrase</th>
          <th>Mot</th>
          <th>Type</th>
        </tr>
        </thead>
        <tbody>
        <tr v-for="(composant, index) in responseJson.syntaxe.phrases" :key="index">
          <td>{{ fullPhrase }}</td>
          <td>{{ composant.mot }}</td>
          <td>{{ composant.type }}</td>
        </tr>
        </tbody>
      </table>

      <!-- TABLEAU ANALYSE SÉMANTIQUE -->
      <h3>📌 Analyse Sémantique</h3>
      <table>
        <thead>
        <tr>
          <th>Catégorie / Mot</th>
          <th>Signification</th>
        </tr>
        </thead>
        <tbody>
        <!-- Affiche l'intention si présente -->
        <tr v-if="responseJson.sémantique.intention">
          <td>Intention</td>
          <td>{{ responseJson.sémantique.intention }}</td>
        </tr>
        <!-- Affiche le contexte -->
        <tr v-if="responseJson.sémantique.contexte">
          <td>Contexte</td>
          <td>{{ responseJson.sémantique.contexte }}</td>
        </tr>
        <!-- Affiche l'interprétation -->
        <tr v-for="(valeur, mot) in responseJson.sémantique.signification" :key="mot">
          <td>{{ mot }}</td>
          <td>{{ valeur }}</td>
        </tr>
        </tbody>
      </table>
    </div>

    <div v-else-if="responseJson && responseJson.error">
      <p>{{ responseJson.error }}</p>
    </div>
  </div>
</template>

<style scoped>
.chat-container {
  max-width: 600px;
  margin: 20px auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
input {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 100%;
}
button {
  padding: 8px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled {
  background-color: #ccc;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th, td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f4f4f4;
}
pre {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 5px;
  overflow-x: auto;
}
</style>
