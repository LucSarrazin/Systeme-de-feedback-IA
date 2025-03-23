<script setup>
import { ref, computed } from "vue";
import { Mistral } from "@mistralai/mistralai";

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
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
    <h2>🔎 Analyse de Phrase</h2>

    <!-- Champ de saisie et bouton -->
    <div class="input-container">
      <input
          v-model="userMessage"
          placeholder="Entrez une phrase à analyser..."
          aria-label="Saisissez une phrase"
      />
      <button @click="sendMessage" :disabled="isLoading">
        {{ isLoading ? "Analyse en cours..." : "Analyser" }}
      </button>
    </div>

    <!-- Animation de chargement -->
    <div v-if="isLoading" class="loading">⏳ Analyse en cours...</div>

    <!-- Affichage des résultats -->
    <div v-if="responseJson && !responseJson.error">
      <!-- 📌 Analyse Syntaxique -->
      <section>
        <br>
        <h3 style="color: black">📌 Analyse Syntaxique</h3>
        <table>
          <thead>
          <tr>
            <th>Mot</th>
            <th>Type</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(composant, index) in responseJson.syntaxe.phrases" :key="index">
            <td>{{ composant.mot }}</td>
            <td>{{ composant.type }}</td>
          </tr>
          </tbody>
        </table>
      </section>
      <br>
      <!-- 📌 Analyse Sémantique -->
      <section>
        <h3 style="color: black">📌 Analyse Sémantique</h3>
        <table>
          <thead>
          <tr>
            <th>Catégorie / Mot</th>
            <th>Signification</th>
          </tr>
          </thead>
          <tbody>
          <tr v-if="responseJson.sémantique.intention">
            <td>Intention</td>
            <td>{{ responseJson.sémantique.intention }}</td>
          </tr>
          <tr v-if="responseJson.sémantique.contexte">
            <td>Contexte</td>
            <td>{{ responseJson.sémantique.contexte }}</td>
          </tr>
          <tr v-for="(valeur, mot) in responseJson.sémantique.signification" :key="mot">
            <td>{{ mot }}</td>
            <td>{{ valeur }}</td>
          </tr>
          </tbody>
        </table>
      </section>
    </div>

    <!-- Message d'erreur si problème -->
    <div v-else-if="responseJson && responseJson.error" class="error-message">
      ❌ {{ responseJson.error }}
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

/* Tables */
table {
width: 100%;
border-collapse: collapse;
margin-top: 15px;
border-radius: 8px;
overflow: hidden;
}

th, td {
padding: 12px;
text-align: left;
border-bottom: 1px solid #ddd;
}

th {
background: #007bff;
color: white;
text-transform: uppercase;
}

td {
background: #f9f9f9;
  color: black;
}

tr:hover td {
background: #e3f2fd;
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

table {
font-size: 14px;
}
}
</style>