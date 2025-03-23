<script setup>
import { ref } from "vue";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url
).toString();


const apiKey = import.meta.env.VITE_MISTRAL_API_KEY;
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
          { role: "system", content: "Tu es un assistant spécialisé en rédaction de lettres de motivation." },
          {
            role: "user",
            content: `Voici un CV extrait d'un PDF : ${cvText}

  Rédige une lettre de motivation formelle et professionnelle basée sur ce CV.
  - Ne donne aucun conseil, remarque ou note explicative.
  - Ne commence pas par "Bien sûr," ni aucune formule similaire.
  - Génère uniquement le texte de la lettre, sans ajouter de commentaires.
  - Adapte le ton pour un recruteur.`
          },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Échec de la génération");

    motivationLetter.value = data.choices[0].message.content;
    startTypingEffect(motivationLetter.value);
    console.log("✉️ Lettre de motivation générée :", motivationLetter.value);
  } catch (error) {
    console.error("❌ Erreur de génération de la lettre :", error);
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



// Fonction pour afficher la réponse caractère par caractère
const startTypingEffect = (text) => {
  let index = 0;
  displayedResponse.value = "";

  const interval = setInterval(() => {
    if (index < text.length) {
      displayedResponse.value += text[index];
      index++;
    } else {
      clearInterval(interval);
    }
  }, 30); // Vitesse de frappe (50ms par caractère)
};
</script>

<template>
  <div class="container">
    <h2>📄 Analyse de PDF & Lettre de Motivation</h2>

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

    <!-- Affichage de la lettre générée -->
    <div v-if="displayedResponse && !isSkipped" class="output">
      <button class="skip-button" @click="isSkipped = true">Skip</button>
      <h3 style="color: black">📜 Lettre de Motivation Générée :</h3>
      <pre>{{ displayedResponse }}</pre>
    </div>

    <div v-if="isSkipped" class="output">
      <div v-if="motivationLetter">
        <h3 style="color: black">📜 Lettre de Motivation Générée :</h3>
        <pre>{{ motivationLetter }}</pre>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Conteneur principal */
.container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  background: #ffffff;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  text-align: center;
}

/* Titre */
h2 {
  color: #333;
  font-size: 22px;
  margin-bottom: 20px;
}

/* Champ de sélection de fichier */
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

/* Bouton d'envoi */
button {
  padding: 12px 16px;
  font-size: 16px;
  font-weight: bold;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
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

/* Position relative pour bien contenir le bouton */
.output {
  position: relative;
  padding-top: 40px; /* Pour ne pas chevaucher le bouton */
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
  content: ""; /* Curseur */
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
  .container {
    width: 90%;
    padding: 15px;
  }

  button {
    width: 100%;
  }

  pre {
    font-size: 13px;
  }
}
</style>
