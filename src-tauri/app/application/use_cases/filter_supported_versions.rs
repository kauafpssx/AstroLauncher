use std::sync::Arc;

use crate::infrastructure::worldgen::cubiomes_provider::WorldgenService;

pub struct FilterSupportedVersionsUseCase {
    worldgen: Arc<WorldgenService>,
}

impl FilterSupportedVersionsUseCase {
    pub fn new(worldgen: Arc<WorldgenService>) -> Self {
        Self { worldgen }
    }

    pub fn execute(&self, version_ids: &[String]) -> Vec<String> {
        version_ids
            .iter()
            .filter(|id| self.worldgen.is_version_supported(id))
            .cloned()
            .collect()
    }
}
