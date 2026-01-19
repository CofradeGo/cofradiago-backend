import { prisma } from "../config/prismaClient.ts";

// Input para crear cofradía
export interface CrearCofradiaInput {
  hermandadId: number;
  nombre: string;
  anio: number;
  tipo: string;
}

// Input para actualizar cofradía
export interface ActualizarCofradiaInput {
  nombre?: string;
  anio?: number;
  tipo?: string;
}

// Opciones para listar cofradías
export interface ListCofradiasOptions {
  hermandadId: number;
  order?: "asc" | "desc";
  estado?: "ABIERTA" | "CERRADA" | undefined;
}

interface ClonarCofradiaInput {
  cofradiaId: number;
  anioNuevo: number;
}

export const cofradiaService = {
  crearCofradia: async ({
    hermandadId,
    nombre,
    anio,
    tipo,
  }: CrearCofradiaInput) => {
    const existe = await prisma.cofradia.findUnique({
      where: { hermandadId_nombre_anio: { hermandadId, nombre, anio } },
    });

    if (existe) {
      throw new Error(
        `Ya existe una cofradía con nombre "${nombre}" y año ${anio} en esta hermandad`
      );
    }

    const cofradia = await prisma.cofradia.create({
      data: { hermandadId, nombre, anio, tipo, estado: "ABIERTA" },
    });

    return cofradia;
  },

  listCofradias: async ({
    hermandadId,
    order = "desc",
    estado,
  }: ListCofradiasOptions) => {
    try {
      const where: { hermandadId: number; estado?: "ABIERTA" | "CERRADA" } = {
        hermandadId,
      };
      if (estado) where.estado = estado;

      return await prisma.cofradia.findMany({
        where,
        select: {
          id: true,
          nombre: true,
          anio: true,
          tipo: true,
          estado: true,
        },
        orderBy: { anio: order },
      });
    } catch (error) {
      console.error("Error en cofradiaService.listCofradias:", error);
      throw new Error("No se pudieron listar las cofradías");
    }
  },

  actualizarCofradia: async (
    cofradiaId: number,
    data: ActualizarCofradiaInput
  ) => {
    const cofradia = await prisma.cofradia.findUnique({ where: { id: cofradiaId } });
    if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
    if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

    // ✅ Filtramos datos válidos nuevamente
    const updateData: ActualizarCofradiaInput = {};
    if (data.nombre && data.nombre.trim() !== "") updateData.nombre = data.nombre.trim();
    if (data.anio !== undefined && data.anio !== null) updateData.anio = data.anio;
    if (data.tipo && data.tipo.trim() !== "") updateData.tipo = data.tipo.trim();

    if (Object.keys(updateData).length === 0) {
      throw new Error("NO_VALID_FIELDS"); // nadie debería llegar aquí, pero refuerzo seguridad
    }

    // Validar unicidad si se cambia nombre y año
    if (
      updateData.nombre &&
      updateData.anio &&
      (updateData.nombre !== cofradia.nombre || updateData.anio !== cofradia.anio)
    ) {
      const existe = await prisma.cofradia.findUnique({
        where: {
          hermandadId_nombre_anio: {
            hermandadId: cofradia.hermandadId,
            nombre: updateData.nombre,
            anio: updateData.anio,
          },
        },
      });
      if (existe) throw new Error(`Ya existe una cofradía con nombre "${updateData.nombre}" y año ${updateData.anio}`);
    }

    return await prisma.cofradia.update({ where: { id: cofradiaId }, data: updateData });
  },


  borrarCofradia: async (cofradiaId: number) => {
    return prisma.$transaction(async (tx) => {
      const cofradia = await tx.cofradia.findUnique({
        where: { id: cofradiaId },
      });

      if (!cofradia) throw new Error("COFRADIA_NOT_FOUND");
      if (cofradia.estado !== "ABIERTA") throw new Error("COFRADIA_CERRADA");

      // 1️⃣ Obtener IDs de insignias
      const insignias = await tx.insignia.findMany({
        where: { cofradiaId },
        select: { id: true },
      });

      const insigniaIds = insignias.map((i) => i.id);

      // 2️⃣ Borrar elementos de insignias
      if (insigniaIds.length) {
        await tx.insigniaElemento.deleteMany({
          where: { insigniaId: { in: insigniaIds } },
        });
      }

      // 3️⃣ Borrar tramos
      await tx.tramo.deleteMany({
        where: { cofradiaId },
      });

      // 4️⃣ Borrar cortejos
      // (esto elimina automáticamente la relación cortejo ↔ insignia)
      await tx.cortejo.deleteMany({
        where: { cofradiaId },
      });

      // 5️⃣ Borrar insignias
      await tx.insignia.deleteMany({
        where: { cofradiaId },
      });

      // 6️⃣ Borrar puestos y cargos
      await tx.puesto.deleteMany({ where: { cofradiaId } });
      await tx.cargo.deleteMany({ where: { cofradiaId } });

      // 7️⃣ Borrar cofradía
      await tx.cofradia.delete({
        where: { id: cofradiaId },
      });

      return {
        message:
          "Cofradía y todos sus elementos relacionados borrados correctamente",
      };
    });
  },

  clonarCofradia: async ({ cofradiaId, anioNuevo }: ClonarCofradiaInput) => {
    return prisma.$transaction(async (tx) => {
      // 1️⃣ Obtener la cofradía original con todas sus relaciones
      const cofradiaOriginal = await tx.cofradia.findUnique({
        where: { id: cofradiaId },
        include: {
          cargos: true,
          puestos: true,
          insignias: {
            include: { elementos: true },
          },
          cortejos: {
            include: {
              tramos: true,
              insignias: true, // solo referencia, NO elementos aquí
            },
          },
        },
      });

      if (!cofradiaOriginal) {
        throw new Error("COFRADIA_NOT_FOUND");
      }

      // 2️⃣ Comprobar que no exista ya una cofradía con mismo nombre y año
      const existe = await tx.cofradia.findUnique({
        where: {
          hermandadId_nombre_anio: {
            hermandadId: cofradiaOriginal.hermandadId,
            nombre: cofradiaOriginal.nombre,
            anio: anioNuevo,
          },
        },
      });

      if (existe) {
        throw new Error(
          `Ya existe una cofradía con nombre "${cofradiaOriginal.nombre}" y año ${anioNuevo}`
        );
      }

      // 3️⃣ Cerrar la cofradía original si está ABIERTA
      if (cofradiaOriginal.estado === "ABIERTA") {
        await tx.cofradia.update({
          where: { id: cofradiaOriginal.id },
          data: { estado: "CERRADA" },
        });
      }

      // 4️⃣ Crear la nueva cofradía
      const nuevaCofradia = await tx.cofradia.create({
        data: {
          hermandadId: cofradiaOriginal.hermandadId,
          nombre: cofradiaOriginal.nombre,
          anio: anioNuevo,
          tipo: cofradiaOriginal.tipo,
          estado: "ABIERTA",
        },
      });

      // 5️⃣ Clonar cargos
      if (cofradiaOriginal.cargos.length) {
        await tx.cargo.createMany({
          data: cofradiaOriginal.cargos.map((c) => ({
            cofradiaId: nuevaCofradia.id,
            nombre: c.nombre,
          })),
        });
      }

      // 6️⃣ Clonar puestos
      if (cofradiaOriginal.puestos.length) {
        await tx.puesto.createMany({
          data: cofradiaOriginal.puestos.map((p) => ({
            cofradiaId: nuevaCofradia.id,
            nombre: p.nombre,
            codigo: p.codigo,
          })),
        });
      }

      // 7️⃣ Clonar insignias (UNA SOLA VEZ) + mapa nombre → id
      const insigniasMap = new Map<string, number>();

      for (const ins of cofradiaOriginal.insignias) {
        const nuevaInsignia = await tx.insignia.create({
          data: {
            cofradiaId: nuevaCofradia.id,
            nombre: ins.nombre,
            descripcion: ins.descripcion,
          },
        });

        insigniasMap.set(ins.nombre, nuevaInsignia.id);

        if (ins.elementos.length) {
          await tx.insigniaElemento.createMany({
            data: ins.elementos.map((e) => ({
              insigniaId: nuevaInsignia.id,
              tipo: e.tipo,
              cantidad: e.cantidad,
            })),
          });
        }
      }

      // 8️⃣ Clonar cortejos y relacionarlos con insignias existentes
      for (const cortejo of cofradiaOriginal.cortejos) {
        const nuevoCortejo = await tx.cortejo.create({
          data: {
            cofradiaId: nuevaCofradia.id,
            nombre: cortejo.nombre,
            orden: cortejo.orden,
            insignias: {
              connect: cortejo.insignias
                .map((ins) => {
                  const insigniaId = insigniasMap.get(ins.nombre);
                  return insigniaId ? { id: insigniaId } : null;
                })
                .filter(Boolean) as { id: number }[],
            },
          },
        });

        // 9️⃣ Clonar tramos
        if (cortejo.tramos.length) {
          await tx.tramo.createMany({
            data: cortejo.tramos.map((t) => ({
              cofradiaId: nuevaCofradia.id,
              cortejoId: nuevoCortejo.id,
              nombre: t.nombre,
              orden: t.orden,
            })),
          });
        }
      }

      return nuevaCofradia;
    });
  },
};
