const { crearApp } = require("./app");
const { RepositorioTareas } = require("./repositorio");

async function main() {
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
  const repositorio = await RepositorioTareas.conectar(uri);
  const app = crearApp({
    repositorio,
    publicador: async (evento) => console.log("Evento:", JSON.stringify(evento)),
  });
  const puerto = process.env.PORT || 3000;
  app.listen(puerto, () => console.log(`Servicio en http://localhost:${puerto}`));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
