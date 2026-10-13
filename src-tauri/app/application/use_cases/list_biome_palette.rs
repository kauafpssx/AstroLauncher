use std::sync::Arc;

use crate::application::dto::BiomePaletteEntryDTO;
use crate::domain::errors::WorldgenError;
use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct ListBiomePaletteUseCase {
    worldgen: Arc<WorldgenService>,
}

impl ListBiomePaletteUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn execute(&self, mc_version: &str) -> Result<Vec<BiomePaletteEntryDTO>, WorldgenError> {
        let palette = self.worldgen.biome_palette(mc_version)?;
        Ok(palette
            .into_iter()
            .map(|(id, name, rgb, dimension)| BiomePaletteEntryDTO {
                id,
                label: name.clone(),
                name,
                color_hex: format!("#{:02X}{:02X}{:02X}", rgb[0], rgb[1], rgb[2]),
                dimension,
            })
            .collect())
    }
}
