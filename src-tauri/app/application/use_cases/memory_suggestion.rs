use std::sync::Arc;

use crate::application::dto::SuggestedMemoryDTO;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::ModRepository;

/// Rough heuristic: more installed content (mods/resourcepacks/shaders)
/// generally means heavier memory usage, so scale the suggested JVM heap
/// with the content count instead of leaving every modpack at the same
/// vanilla-sized default (2048/4096). Not a precise science: just a better
/// starting point than the vanilla default for a heavily modded instance.
pub fn suggest_memory_mb(content_count: i64) -> (i64, i64) {
    let extra = (content_count * 40).min(8192);
    let max_mb = (4096 + extra).min(12288);
    let min_mb = (max_mb / 2).max(1024);
    (min_mb, max_mb)
}

#[cfg(test)]
#[path = "tests/memory_suggestion_tests.rs"]
mod tests;

pub struct SuggestMemoryUseCase {
    mod_repository: Arc<dyn ModRepository>,
}

impl SuggestMemoryUseCase {
    pub fn new(mod_repository: Arc<dyn ModRepository>) -> Self {
        Self { mod_repository }
    }

    pub fn execute(&self, instance_id: &str) -> Result<SuggestedMemoryDTO, InstanceError> {
        let content_count = self.mod_repository.find_by_instance(instance_id)?.len() as i64;
        let (min_mb, max_mb) = suggest_memory_mb(content_count);
        Ok(SuggestedMemoryDTO { min_mb, max_mb })
    }
}
