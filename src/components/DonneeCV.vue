<script setup>
import { ref, computed } from "vue";
import { Mistral } from "@mistralai/mistralai";
import * as pdfjsLib from "pdfjs-dist";

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

const userMessage = ref("");
const responseJson = ref(null);
const rawResponse = ref("");
const isLoading = ref(false);

const pdfFile = ref(null);
const isUploading = ref(false);
const extractedText = ref("");
const motivationLetter = ref("");
const displayedResponse = ref("");
const isSkipped = ref(false);

// Sélection du fichier PDF
const handleFileSelection = (event) => {
  const file = event.target.files[0];
  if (!file) {
    console.error("Aucun fichier sélectionné !");
    return;
  }
  if (file.type !== "application/pdf") {
    alert("Veuillez sélectionner un fichier PDF.");
    return;
  }
  pdfFile.value = file;
  console.log("📄 Fichier sélectionné :", file.name);
};

// Extraction du texte du PDF
const extractTextFromPDF = async (file) => {
  const reader = new FileReader();
  reader.readAsArrayBuffer(file);

  return new Promise((resolve, reject) => {
    reader.onload = async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(reader.result) }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ") + "\n";
        }
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
  });
};


// Fonction pour extraire le JSON de la réponse brute
const extractJson = (text) => {
  // Recherche le contenu entre ```json et ```
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
  return jsonMatch ? jsonMatch[1] : null;
};

// const sendMessage = async () => {
//   if (!userMessage.value.trim()) return;
//
//   isLoading.value = true;
//   responseJson.value = null;
//   rawResponse.value = "";
//
//   try {
//     const chatResponse = await client.chat.complete({
//       model: "mistral-large-latest",
//       messages: [{
//         role: "user",
//         content: `Analyse le cv fournie et retourne uniquement un JSON respectant strictement cette structure :
// {
//   "Compétences techniques et méthodologiques": {
//     "Compétences": [
//       {
//         "Catégorie": "exemple",
//         "Compétence": "exemple",
//         "Niveau": "exemple"
//       }
//     ]
//   },
//   "Compétences relationnelles / soft": {
//     "Compétences": [
//       {
//         "Catégorie": "exemple",
//         "Compétence": "exemple",
//         "Niveau": "exemple"
//       }
//     ]
//   },
//   "Compétences managériales": {
//     "Compétences": [
//       {
//         "Catégorie": "exemple",
//         "Compétence": "exemple",
//         "Niveau": "exemple"
//       }
//     ]
//   },
// }
// Remplace "exemple" par les valeurs correspondant à la phrase : "${userMessage.value}". Ne retourne rien d'autre que le JSON.`
//       }]
//     });
//
//     // Récupère la réponse brute de l'IA
//     rawResponse.value = chatResponse.choices[0].message.content;
//     console.log("🔹 Réponse brute de l'IA :", rawResponse.value);
//
//     // Extrait le JSON de la réponse
//     const extracted = extractJson(rawResponse.value);
//     if (extracted) {
//       responseJson.value = JSON.parse(extracted);
//     } else {
//       throw new Error("Impossible d'extraire le JSON de la réponse.");
//     }
//   } catch (error) {
//     console.error("❌ Erreur API Mistral:", error);
//     responseJson.value = { error: "Impossible d'analyser la phrase." };
//   } finally {
//     isLoading.value = false;
//   }
// };

// Génération de la lettre de motivation avec l'IA
const generateMotivationLetter = async (cvText) => {
  if (!cvText) {
    console.error("❌ Aucun texte de CV à envoyer.");
    return;
  }

  try {
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: "Tu dois à partir d'un CV fourni extraire un certain nombre d’informations et les présenter sous forme synthétique (comme le json que tu va recevoir)" },
          {
            role: "user",
            content: `Voici un CV extrait d'un PDF : ${cvText}

  \`Analyse le cv fournie et retourne uniquement un JSON respectant strictement cette structure :
{
  "Compétences techniques et méthodologiques": {
    "Compétences": [
      {
        "Catégorie": "exemple",
        "Compétence": "exemple",
        "Niveau": "exemple"
      }
    ]
  },
  "Compétences relationnelles / soft": {
    "Compétences": [
      {
        "Catégorie": "exemple",
        "Compétence": "exemple",
        "Niveau": "exemple"
      }
    ]
  },
  "Compétences managériales": {
    "Compétences": [
      {
        "Catégorie": "exemple",
        "Compétence": "exemple",
        "Niveau": "exemple"
      }
    ]
  },
}
Remplace "exemple" par les valeurs correspondant au cv en pdf que tu as reçu, Ne retourne rien d'autre que le JSON.\``
          },
        ],
      }),
    });


    const chatResponse = await response.json();
    if (!response.ok) throw new Error(chatResponse.error || "Échec de la génération");

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


// Processus complet : Extraction + Génération
const uploadFile = async () => {
  if (!pdfFile.value) {
    alert("Veuillez sélectionner un fichier avant d'envoyer.");
    return;
  }

  isUploading.value = true;

  try {
    extractedText.value = await extractTextFromPDF(pdfFile.value);
    console.log("📄 Texte extrait du PDF :", extractedText.value);
    await generateMotivationLetter(extractedText.value);
  } catch (error) {
    console.error("❌ Erreur :", error);
  } finally {
    isUploading.value = false;
  }
};

</script>

<template>
  <div class="chat-container">
    <h2>🔎 Analyse de CV</h2>

    <!-- Champ de sélection de fichier -->
    <div class="file-input-container">
      <label for="file-upload" class="custom-file-upload">
        📂 Choisir un PDF
      </label>
      <input id="file-upload" type="file" accept="application/pdf" @change="handleFileSelection" />
      <p v-if="pdfFile" class="file-info">📄 Fichier sélectionné : <strong>{{ pdfFile.name }}</strong></p>
    </div>

    <!-- Bouton d'envoi -->
    <button :disabled="!pdfFile || isUploading" @click="uploadFile">
      {{ isUploading ? "⏳ Traitement en cours..." : "📤 Envoyer le PDF" }}
    </button>

    <!-- Animation de chargement -->
    <div v-if="isLoading" class="loading">⏳ Analyse en cours...</div>

    <!-- Affichage des résultats -->
    <div v-if="responseJson && !responseJson.error">
      <!-- 📌 Compétences Techniques -->
      <section>
        <h3 style="color: black">📌 Compétences techniques et méthodologiques</h3>
        <table>
          <thead>
          <tr>
            <th>Catégorie</th>
            <th>Compétence</th>
            <th>Niveau</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(competence, index) in responseJson['Compétences techniques et méthodologiques'].Compétences" :key="index">
            <td>{{ competence.Catégorie }}</td>
            <td>{{ competence.Compétence }}</td>
            <td>{{ competence.Niveau }}</td>
          </tr>
          </tbody>
        </table>
      </section>

      <!-- 📌 Compétences Relationnelles -->
      <section>
        <h3 style="color: black">📌 Compétences relationnelles / soft</h3>
        <table>
          <thead>
          <tr>
            <th>Catégorie</th>
            <th>Compétence</th>
            <th>Niveau</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(competence, index) in responseJson['Compétences relationnelles / soft'].Compétences" :key="index">
            <td>{{ competence.Catégorie }}</td>
            <td>{{ competence.Compétence }}</td>
            <td>{{ competence.Niveau }}</td>
          </tr>
          </tbody>
        </table>
      </section>

      <!-- 📌 Compétences Managériales  -->
      <section>
        <h3 style="color: black">📌 Compétences managériales</h3>
        <table>
          <thead>
          <tr>
            <th>Catégorie</th>
            <th>Compétence</th>
            <th>Niveau</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(competence, index) in responseJson['Compétences managériales'].Compétences" :key="index">
            <td>{{ competence.Catégorie }}</td>
            <td>{{ competence.Compétence }}</td>
            <td>{{ competence.Niveau }}</td>
          </tr>
          </tbody>
        </table>
      </section>


      <!-- 📌 Autres sections de la réponse -->
<!--      <section>-->
<!--        <h3 style="color: black">📌 Autres compétences</h3>-->
        <!-- Ajouter d'autres sections ici selon la structure de la réponse -->
<!--        <pre>{{ rawResponse }}</pre>-->
<!--      </section>-->
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

/* Conteneur du fichier sélectionné */
.file-input-container {
  margin-bottom: 15px;
}

.custom-file-upload {
  display: inline-block;
  padding: 10px 15px;
  font-size: 16px;
  color: white;
  background-color: #007bff;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.3s ease-in-out;
}

.custom-file-upload:hover {
  background-color: #0056b3;
}

/* Cacher l'input par défaut */
input[type="file"] {
  display: none;
}

.file-info {
  margin-top: 10px;
  font-size: 14px;
  color: #333;
}

/* Position relative pour bien contenir le bouton */
.output {
  position: relative;
  padding-top: 40px;
  margin-top: 20px;
  text-align: left;
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

pre::after {
  content: "";
  animation: blink 0.8s infinite;
}

/* Bouton Skip aligné à droite */
.skip-button {
  position: absolute;
  right: 10px;
  top: 10px;
  background: #ff4d4d;
  color: white;
  padding: 8px 12px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

.skip-button:hover {
  background: #cc0000;
}

@keyframes blink {
  0% { opacity: 1; }
  50% { opacity: 0; }
  100% { opacity: 1; }
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

  pre {
    font-size: 13px;
  }
}
</style>
