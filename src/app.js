const express = require("express");
const { randomUUID } = require("crypto");
const { estadoDeTarea } = require("./tarea");
const { construirEventoTareaCreada } = require("./eventos");

/**
 * Fábrica de la aplicación Express. No llama a listen(): así Supertest
 * puede levantarla en un puerto efímero y las dependencias se inyectan.
 */
function crearApp({
  repositorio,
  publicador = async () => {},
  reloj = () => new Date(),
} = {}) {
  if (!repositorio) throw new Error("Se requiere un repositorio");

  const app = express();
  app.use(express.json());

  app.post("/tareas", async (req, res, next) => {
    try {
      const { titulo, vence } = req.body;

      if (typeof titulo !== "string" || titulo.trim() === "") {
        return res.status(400).json({ error: "El título es obligatorio" });
      }
      if (
        vence !== undefined &&
        (typeof vence !== "string" || Number.isNaN(Date.parse(vence)))
      ) {
        return res.status(400).json({ error: "La fecha 'vence' no es válida" });
      }

      const ahora = reloj();
      const tarea = {
        id: randomUUID(),
        titulo: titulo.trim(),
        completada: false,
        creadaEn: ahora.toISOString(),
      };
      if (vence !== undefined) tarea.vence = new Date(vence).toISOString();

      await repositorio.guardar(tarea);
      await publicador(construirEventoTareaCreada(tarea));

      return res.status(201).json({ ...tarea, estado: estadoDeTarea(tarea, ahora) });
    } catch (err) {
      return next(err);
    }
  });

  app.get("/tareas", async (req, res, next) => {
    try {
      const ahora = reloj();
      const tareas = await repositorio.buscar();
      return res
        .status(200)
        .json(tareas.map((t) => ({ ...t, estado: estadoDeTarea(t, ahora) })));
    } catch (err) {
      return next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "JSON inválido" });
    }
    console.error(err);
    return res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}

module.exports = { crearApp };
