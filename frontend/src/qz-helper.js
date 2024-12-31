// Importation de QZ Tray
const qz = window.qz;

// Initialisation de QZ Tray
export async function connectToQZTray() {
  try {
    await qz.websocket.connect();
    console.log("QZ Tray connecté !");
  } catch (err) {
    console.error("Erreur lors de la connexion à QZ Tray :", err);
  }
}

// Configurer l'imprimante
export function configurePrinter(printerName) {
  return qz.configs.create(printerName, {
    size: { width: 80, height: null }, // Taille du papier : 80mm
    units: "mm", // Unités en millimètres
  });
}

// Imprimer du contenu
export async function printWithQZTray(config, content) {
  try {
    await qz.print(config, [
      {
        type: "html",
        format: "plain",
        data: content,
      },
    ]);
    console.log("Impression réussie !");
  } catch (err) {
    console.error("Erreur lors de l'impression :", err);
  }
}
