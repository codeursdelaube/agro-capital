async function testFastAPI() {
  const url = "https://agro-capital-production.up.railway.app";
  
  try {
    const health = await fetch(`${url}/health`);
    console.log("HEALTH:", health.status, await health.json());

    const chat = await fetch(`${url}/agro-pilot/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: "cmler1234567890",
        message: "Bonjour",
      }),
    });
    console.log("CHAT Status:", chat.status);
    console.log("CHAT Response:", await chat.json());
  } catch (err) {
    console.error("ERR:", err);
  }
}

testFastAPI();
