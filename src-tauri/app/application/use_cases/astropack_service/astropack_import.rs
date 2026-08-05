use std::sync::Arc;

use anyhow::Context;

use crate::application::dto::{AstroPackEventDTO, AstroPackManifest, ExportSelection, InstanceDTO};
use crate::application::mappers::instance_mapper;
use crate::domain::entities::Instance;
use crate::infrastructure::filesystem::paths;
use crate::infrastructure::filesystem::safe_path::safe_join;
use crate::infrastructure::minecraft::servers_dat::{self, ServerEntry};

use super::helpers::read_manifest_json;
use super::AstroPackService;

impl AstroPackService {
    pub async fn import_astropack(
        &self,
        file_path: &str,
        selection: ExportSelection,
        on_event: Arc<dyn Fn(AstroPackEventDTO) + Send + Sync>,
    ) -> anyhow::Result<InstanceDTO> {
        let file = std::fs::File::open(file_path)
            .with_context(|| format!("Falha ao abrir {file_path}"))?;
        let mut archive = zip::ZipArchive::new(file)
            .with_context(|| format!("Falha ao ler o zip {file_path}"))?;

        let manifest_json = read_manifest_json(&mut archive)?;
        let manifest: AstroPackManifest = serde_json::from_str(&manifest_json)?;

        let mut instance = Instance::new(manifest.name.clone(), manifest.version.clone());
        instance.loader = manifest.loader.clone();
        instance.loader_version = manifest.loader_version.clone();
        instance.java_args = manifest.java_args.clone();
        instance.min_memory = manifest.min_memory;
        instance.max_memory = manifest.max_memory;
        instance.icon_path = manifest.icon.clone();
        self.instance_repository.save(&instance)?;

        let instance_dir = paths::instance_dir(&self.app_data_dir, &instance.id);
        std::fs::create_dir_all(&instance_dir).with_context(|| {
            format!(
                "Falha ao criar pasta da instância {}",
                instance_dir.display()
            )
        })?;

        let selected_contents: Vec<_> = manifest
            .contents
            .iter()
            .filter(|entry| match entry.kind.as_str() {
                "resourcepack" => selection.resourcepacks,
                "shader" => selection.shaders,
                _ => selection.mods,
            })
            .collect();

        let world_count = if selection.worlds {
            manifest.worlds.len()
        } else {
            0
        };
        let screenshot_count = if selection.screenshots {
            manifest.screenshots.len()
        } else {
            0
        };
        let total = (selected_contents.len() + world_count + screenshot_count) as u64;
        let mut current: u64 = 0;

        self.install_contents(
            &mut archive,
            &instance.id,
            &selected_contents,
            &instance_dir,
            &on_event,
            total,
            &mut current,
        )
        .await;

        if selection.settings {
            if let Some(settings) = &manifest.settings {
                let _ = std::fs::write(instance_dir.join("options.txt"), settings);
            }
        }

        if selection.notes && !manifest.notes.is_empty() {
            let notes_dir = instance_dir.join("notes");
            let _ = std::fs::create_dir_all(&notes_dir);
            for note in &manifest.notes {
                let safe_title = note.title.replace(['/', '\\'], "-");
                let _ = std::fs::write(notes_dir.join(format!("{safe_title}.md")), &note.content);
            }
        }

        if selection.worlds {
            let saves_dir = instance_dir.join("saves");
            for world_name in &manifest.worlds {
                on_event(AstroPackEventDTO::Progress {
                    kind: "world".to_string(),
                    name: world_name.clone(),
                    icon_url: None,
                    current,
                    total,
                });
                current += 1;

                let prefix = format!("content/worlds/{world_name}/");
                let entry_names: Vec<String> = (0..archive.len())
                    .filter_map(|i| archive.by_index(i).ok().map(|e| e.name().to_string()))
                    .filter(|name| name.starts_with(&prefix))
                    .collect();

                for entry_name in entry_names {
                    let relative = &entry_name[prefix.len()..];
                    // `world_name` and `relative` come from untrusted zip entry
                    // names — reject any `..`/absolute that would escape saves/.
                    let Some(dest) = safe_join(&saves_dir, &format!("{world_name}/{relative}"))
                    else {
                        continue;
                    };
                    if let Some(parent) = dest.parent() {
                        let _ = std::fs::create_dir_all(parent);
                    }
                    if let Ok(mut zip_entry) = archive.by_name(&entry_name) {
                        if let Ok(mut out) = std::fs::File::create(&dest) {
                            let _ = std::io::copy(&mut zip_entry, &mut out);
                        }
                    }
                }
            }
        }

        if selection.servers && !manifest.servers.is_empty() {
            let servers: Vec<ServerEntry> = manifest
                .servers
                .iter()
                .map(|s| ServerEntry {
                    name: s.name.clone(),
                    ip: s.ip.clone(),
                })
                .collect();
            let _ = servers_dat::write_servers(&instance_dir.join("servers.dat"), &servers);
        }

        if selection.screenshots {
            let shots_dir = instance_dir.join("screenshots");
            let _ = std::fs::create_dir_all(&shots_dir);
            for name in &manifest.screenshots {
                on_event(AstroPackEventDTO::Progress {
                    kind: "screenshot".to_string(),
                    name: name.clone(),
                    icon_url: None,
                    current,
                    total,
                });
                current += 1;

                let zip_entry_name = format!("content/screenshots/{name}");
                let Some(dest) = safe_join(&shots_dir, name) else {
                    continue;
                };
                if let Ok(mut zip_entry) = archive.by_name(&zip_entry_name) {
                    if let Ok(mut out) = std::fs::File::create(&dest) {
                        let _ = std::io::copy(&mut zip_entry, &mut out);
                    }
                }
            }
        }

        on_event(AstroPackEventDTO::Done {
            instance_id: instance.id.clone(),
        });

        Ok(instance_mapper::to_dto(&instance))
    }
}
