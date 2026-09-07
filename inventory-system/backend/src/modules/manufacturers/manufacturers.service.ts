import { AppError } from "@/utils/AppError";
import { logAudit } from "@/modules/audit/audit.service";
import * as repo from "./manufacturers.repository";

export function listManufacturers() {
  return repo.listAll();
}

export async function createManufacturer(name: string, actingUserId: string) {
  const trimmed = name.trim();
  if (!trimmed) throw AppError.validation("Nome da montadora e obrigatorio");

  const existing = await repo.findByName(trimmed);
  if (existing) throw AppError.conflict("Esta montadora ja esta cadastrada");

  const manufacturer = await repo.create(trimmed);
  await logAudit({
    userId: actingUserId,
    action: "CREATE_MANUFACTURER",
    entity: "Manufacturer",
    entityId: manufacturer.id,
    after: manufacturer,
  });
  return manufacturer;
}
