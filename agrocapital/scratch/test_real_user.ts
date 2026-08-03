import { prisma } from "../app/_lib/prisma.js";

async function run() {
  try {
    const user = await prisma.user.findFirst();
    console.log("Vrai utilisateur trouvé :", user?.id, user?.nom, user?.region);

    if (!user) {
      console.log("Aucun utilisateur en base !");
      return;
    }

    const url = "https://agro-capital-production.up.railway.app";
    const chat = await fetch(`${url}/agro-pilot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id,
        message: "Quand devrais-je vendre mon maïs ?",
      }),
    });

    console.log("Réponse FastAPI pour vrai user :", await chat.json());
  } catch (e) {
    console.error("Erreur:", e);
  } finally {
    await prisma.$disconnect();
  }
}

run();
