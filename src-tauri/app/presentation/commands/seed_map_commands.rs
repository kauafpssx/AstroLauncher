use tauri::State;

use crate::application::dto::{SpawnPointDTO, SpawnPointInput};
use crate::presentation::state::AppState;

mod biome_commands;
mod slime_commands;
mod structure_commands;

pub use biome_commands::*;
pub use slime_commands::*;
pub use structure_commands::*;

#[tauri::command]
pub fn get_spawn_point(
    state: State<AppState>,
    input: SpawnPointInput,
) -> Result<SpawnPointDTO, String> {
    state
        .get_spawn_point
        .execute(input)
        .map_err(|e| e.to_string())
}
