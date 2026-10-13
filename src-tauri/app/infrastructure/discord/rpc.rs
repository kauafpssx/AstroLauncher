use std::sync::mpsc::{self, Receiver, RecvTimeoutError, Sender};
use std::thread;
use std::time::Duration;

use discord_rich_presence::activity::{Activity, Assets, Button, Timestamps};
use discord_rich_presence::{DiscordIpc, DiscordIpcClient};

const RETRY_INTERVAL: Duration = Duration::from_secs(15);

fn repo_url() -> String {
    let env = crate::infrastructure::config::env();
    format!(
        "{}/{}",
        env.github_base.trim_end_matches('/'),
        env.github_repo
    )
}

enum PresenceState {
    Idle,
    Custom {
        details: String,
        state: String,
    },
    Playing {
        instance_name: String,
        mod_count: usize,
        started_at: i64,
    },
}

#[derive(Clone)]
pub struct DiscordRpcHandle {
    sender: Sender<PresenceState>,
}

#[must_use]
pub struct PresenceGuard<'a> {
    handle: &'a DiscordRpcHandle,
}

impl Drop for PresenceGuard<'_> {
    fn drop(&mut self) {
        self.handle.set_idle();
    }
}

impl DiscordRpcHandle {
    pub fn spawn(client_id: String, logo_asset_key: String) -> Self {
        let (sender, receiver) = mpsc::channel();
        thread::spawn(move || run(client_id, logo_asset_key, receiver));
        Self { sender }
    }

    pub fn set_idle(&self) {
        let _ = self.sender.send(PresenceState::Idle);
    }

    pub fn set_custom(&self, details: impl Into<String>, state: impl Into<String>) {
        let _ = self.sender.send(PresenceState::Custom {
            details: details.into(),
            state: state.into(),
        });
    }

    pub fn set_playing(&self, instance_name: String, mod_count: usize, started_at: i64) {
        let _ = self.sender.send(PresenceState::Playing {
            instance_name,
            mod_count,
            started_at,
        });
    }

    pub fn guard(&self, details: impl Into<String>, state: impl Into<String>) -> PresenceGuard<'_> {
        self.set_custom(details, state);
        PresenceGuard { handle: self }
    }
}

fn run(client_id: String, logo_asset_key: String, receiver: Receiver<PresenceState>) {
    let mut client: Option<DiscordIpcClient> = None;
    let mut current = PresenceState::Idle;

    loop {
        if client.is_none() {
            let mut candidate = DiscordIpcClient::new(&client_id);
            if candidate.connect().is_ok()
                && apply(&mut candidate, &logo_asset_key, &current).is_ok()
            {
                client = Some(candidate);
            }
        }

        match receiver.recv_timeout(RETRY_INTERVAL) {
            Ok(state) => {
                current = state;
                if let Some(c) = client.as_mut() {
                    if apply(c, &logo_asset_key, &current).is_err() {
                        client = None;
                    }
                }
            }
            Err(RecvTimeoutError::Timeout) => {}
            Err(RecvTimeoutError::Disconnected) => break,
        }
    }
}

fn apply(
    client: &mut DiscordIpcClient,
    logo_asset_key: &str,
    state: &PresenceState,
) -> anyhow::Result<()> {
    let assets = Assets::new()
        .large_image(logo_asset_key)
        .large_text("AstroLauncher");

    let (details, state_text, timestamps) = match state {
        PresenceState::Idle => (
            "AstroLauncher".to_string(),
            "No menu principal".to_string(),
            None,
        ),
        PresenceState::Custom { details, state } => (details.clone(), state.clone(), None),
        PresenceState::Playing {
            instance_name,
            mod_count,
            started_at,
        } => {
            let mods_label = if *mod_count > 0 {
                format!("{mod_count} mods")
            } else {
                "Vanilla".to_string()
            };
            (
                format!("Jogando {instance_name}"),
                mods_label,
                Some(Timestamps::new().start(*started_at)),
            )
        }
    };

    let mut activity = Activity::new()
        .details(&details)
        .state(&state_text)
        .assets(assets)
        .buttons(vec![Button::new("Ver repositório", repo_url())]);
    if let Some(timestamps) = timestamps {
        activity = activity.timestamps(timestamps);
    }

    client
        .set_activity(activity)
        .map_err(|err| anyhow::anyhow!(err))?;
    Ok(())
}
