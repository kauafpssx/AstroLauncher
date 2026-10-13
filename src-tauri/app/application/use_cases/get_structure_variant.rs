use std::sync::Arc;

use crate::application::dto::{StructureVariantDTO, StructureVariantInput};
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct GetStructureVariantUseCase {
    worldgen: Arc<WorldgenService>,
}

impl GetStructureVariantUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn execute(
        &self,
        input: StructureVariantInput,
    ) -> Result<StructureVariantDTO, WorldgenError> {
        let seed = input
            .seed
            .parse::<i64>()
            .map_err(|e| WorldgenError::InvalidInput(format!("invalid seed: {e}")))?;

        let sv = self.worldgen.structure_variant(
            seed,
            &input.mc_version,
            &input.dimension,
            &input.structure_type,
            input.x,
            input.z,
        )?;

        let biome_name = |id: i16| -> Option<String> {
            if id < 0 {
                return None;
            }
            self.worldgen
                .biome_name(&input.mc_version, id as i32)
                .ok()
                .filter(|s| !s.is_empty())
        };

        let mut dto = StructureVariantDTO::default();
        match input.structure_type.as_str() {
            "village" => {
                dto.abandoned = Some(sv.abandoned != 0);
                dto.village_biome = biome_name(sv.biome);
            }
            "bastion" => {
                dto.bastion_type = Some(
                    match sv.start {
                        0 => "housing",
                        1 => "hoglin_stable",
                        2 => "treasure",
                        3 => "bridge",
                        _ => "unknown",
                    }
                    .to_string(),
                );
            }
            "ruined_portal" | "ruined_portal_n" => {
                dto.ruined_portal_giant = Some(sv.giant != 0);
                dto.ruined_portal_underground = Some(sv.underground != 0);
                dto.ruined_portal_air_pocket = Some(sv.airpocket != 0);
                dto.ruined_portal_biome = biome_name(sv.biome);
            }
            "igloo" => {
                dto.igloo_has_basement = Some(sv.basement != 0);
            }
            "geode" => {
                dto.geode_cracked = Some(sv.cracked != 0);
                dto.geode_size = Some(sv.size as i32);
            }
            _ => {}
        }
        Ok(dto)
    }
}
