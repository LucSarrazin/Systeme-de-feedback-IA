<script setup>
import { ref, computed } from "vue";
import { Mistral } from "@mistralai/mistralai";
import * as pdfjsLib from "pdfjs-dist";

const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
const client = new Mistral({ apiKey });

const pdfFiles = ref([]);
const isUploading = ref(false);
const extractedTexts = ref([]);
const responseJsons = ref([]);
const isLoading = ref(false);
const showModalIndex = ref(null); // Variable pour afficher la modal du CV cliqué

// Sélection des fichiers PDF
const handleFileSelection = (event) => {
  const files = Array.from(event.target.files);
  if (!files.length) {
    console.error("Aucun fichier sélectionné !");
    return;
  }
  pdfFiles.value = files;
  console.log("📄 Fichiers sélectionnés :", files.map(file => file.name).join(", "));
};

// Extraction du texte des fichiers PDF
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
          text += content.items.map(item => item.str).join(" ") + "\n";
        }
        resolve(text);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
  });
};

// Fonction pour analyser le CV avec Mistral et obtenir les compétences
const analyzeCV = async (cvText) => {
  if (!cvText) return null;

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
          {
            role: "system",
            content: "Tu dois extraire les compétences d'un CV et les présenter sous forme JSON."
          },
          {
            role: "user",
            content: `Voici un CV extrait d'un PDF : ${cvText}

Analyse le CV et retourne uniquement un JSON respectant cette structure :
{
  "Nom": "Nom du candidat",
  "Compétences techniques": [{"Catégorie": "exemple", "Compétence": "exemple", "Niveau": "exemple"}],
  "Compétences relationnelles": [{"Catégorie": "exemple", "Compétence": "exemple", "Niveau": "exemple"}],
  "Compétences managériales": [{"Catégorie": "exemple", "Compétence": "exemple", "Niveau": "exemple"}]
}`
          }
        ],
      }),
    });

    const chatResponse = await response.json();
    if (!response.ok) throw new Error(chatResponse.error || "Erreur de génération");

    const rawResponse = chatResponse.choices[0].message.content;
    const jsonMatch = rawResponse.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    } else {
      throw new Error("Impossible d'extraire le JSON de la réponse.");
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse du CV :", error);
    return null;
  }
};

// Processus complet : Extraction + Analyse de tous les CVs
const uploadFiles = async () => {
  if (!pdfFiles.value.length) {
    alert("Veuillez sélectionner des fichiers avant d'envoyer.");
    return;
  }

  isUploading.value = true;
  responseJsons.value = [];
  extractedTexts.value = [];

  try {
    // Extraction du texte et analyse pour chaque fichier
    for (let file of pdfFiles.value) {
      const text = await extractTextFromPDF(file);
      extractedTexts.value.push(text);
      const jsonResponse = await analyzeCV(text);
      if (jsonResponse) {
        responseJsons.value.push({
          name: file.name,
          competencies: jsonResponse
        });
      }
    }
  } catch (error) {
    console.error("Erreur pendant le traitement des fichiers :", error);
  } finally {
    isUploading.value = false;
  }
};

// Afficher la modal pour un CV spécifique
const showModal = (index) => {
  showModalIndex.value = index;
};

// Fermer la modal
const closeModal = () => {
  showModalIndex.value = null;
};
</script>

<template>
  <div class="chat-container">
    <h2>📄 Analyse des CVs</h2>

    <!-- Sélection des fichiers -->
    <div class="file-input-container">
      <label for="file-upload" class="custom-file-upload">
        📂 Choisir des fichiers PDF
      </label>
      <input id="file-upload" type="file" accept="application/pdf" @change="handleFileSelection" multiple />
      <p v-if="pdfFiles.length" class="file-info">
        📄 Fichiers sélectionnés : <strong>{{ pdfFiles.map(file => file.name).join(", ") }}</strong>
      </p>
    </div>

    <!-- Bouton d'envoi -->
    <button :disabled="!pdfFiles.length || isUploading" @click="uploadFiles">
      {{ isUploading ? "⏳ Traitement en cours..." : "📤 Envoyer les CVs" }}
    </button>

    <!-- Animation de chargement -->
    <div v-if="isUploading" class="loading">⏳ Traitement en cours...</div>
    <br>
    <br>
    <h3 style="color: black">📌 CV analysées : </h3>

    <!-- Modals -->
    <div v-for="(cv, index) in responseJsons" :key="index">
      <div v-if="showModalIndex === index" class="modal">
        <div class="modal-content">
          <span class="close" @click="closeModal">&times;</span>
          <h3>CV de {{ cv.competencies.Nom }}</h3>
          <table>
            <thead>
            <tr>
              <th>Compétences techniques</th>
              <th>Compétences relationnelles</th>
              <th>Compétences managériales</th>
            </tr>
            </thead>
            <tbody>
            <tr>
              <td>
                <ul>
                  <li v-for="(competence, idx) in cv.competencies['Compétences techniques']" :key="idx">
                    {{ competence.Compétence }} ({{ competence.Niveau }})
                  </li>
                </ul>
              </td>
              <td>
                <ul>
                  <li v-for="(competence, idx) in cv.competencies['Compétences relationnelles']" :key="idx">
                    {{ competence.Compétence }} ({{ competence.Niveau }})
                  </li>
                </ul>
              </td>
              <td>
                <ul>
                  <li v-for="(competence, idx) in cv.competencies['Compétences managériales']" :key="idx">
                    {{ competence.Compétence }} ({{ competence.Niveau }})
                  </li>
                </ul>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <button @click="showModal(index)">Afficher {{ cv.competencies.Nom }}</button>
      <br>
    </div>
  </div>
</template>

<style>/* Styles généraux pour les modals */
.modal {
  display: block;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8); /* Fond légèrement plus sombre pour mieux mettre en valeur le contenu */
  overflow: auto;
  padding-top: 60px;
}

/* Contenu de la modal */
.modal-content {
  background-color: #fefefe;
  margin: 10px auto;
  padding: 20px;
  border: 1px solid #888;
  width: 90%;  /* Plus large pour prendre presque tout l'espace */
  height: 90%; /* Prend presque toute la hauteur de l'écran */
  overflow-y: auto; /* Ajout d'une barre de défilement si le contenu dépasse */
  box-sizing: border-box;
  display: block; /* Utilisation de 'block' pour mieux gérer l'alignement vertical */
}

/* Bouton de fermeture */
.close {
  color: #aaa;
  float: right;
  font-size: 36px;
  font-weight: bold;
}

.close:hover,
.close:focus {
  color: black;
  text-decoration: none;
  cursor: pointer;
}

/* Style du tableau */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
  border-right: 1px solid #ddd; /* Ajout d'une barre verticale entre les colonnes */
  font-size: 16px; /* Augmenter la taille de la police pour plus de lisibilité */
  vertical-align: top; /* Assurer que tout le contenu commence en haut de chaque cellule */
}

th {
  font-weight: bold;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}

h3 {
  color: black;
  margin-top: 0; /* Assurer que le titre commence bien en haut */
}

/* Responsivité */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    height: 95%;
  }

  th, td {
    font-size: 14px; /* Taille de police plus petite sur petits écrans */
  }
}
</style>
