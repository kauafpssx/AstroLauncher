use std::sync::Arc;

use chrono::{DateTime, Utc};

use crate::application::dto::PlaytimeSummaryDTO;
use crate::domain::entities::PlaytimeSession;
use crate::domain::errors::InstanceError;
use crate::domain::repositories::{InstanceRepository, PlaytimeRepository};

/// Tracks individual play sessions: a row is inserted when the game is spawned
/// and closed (with its duration) when the process exits. On close it also
/// keeps the instance's denormalized `playtime_seconds` / `last_played`
/// columns in sync (docs/12-armazenamento.md).
pub struct PlaytimeService {
    instance_repository: Arc<dyn InstanceRepository>,
    playtime_repository: Arc<dyn PlaytimeRepository>,
}

impl PlaytimeService {
    pub fn new(
        instance_repository: Arc<dyn InstanceRepository>,
        playtime_repository: Arc<dyn PlaytimeRepository>,
    ) -> Self {
        Self {
            instance_repository,
            playtime_repository,
        }
    }

    pub fn start_session(&self, instance_id: &str) -> Result<PlaytimeSession, InstanceError> {
        self.instance_repository.find_by_id(instance_id)?;
        let session = PlaytimeSession::new(instance_id.to_string());
        self.playtime_repository.insert(&session)?;
        Ok(session)
    }

    /// Closes an open session, records its duration, and adds it to the
    /// instance's total playtime. Idempotent for sessions already closed.
    pub fn end_session(&self, session_id: &str) -> Result<(), InstanceError> {
        let session = self
            .playtime_repository
            .find_by_id(session_id)?
            .ok_or_else(|| InstanceError::NotFound(session_id.to_string()))?;
        if session.ended_at.is_some() {
            return Ok(());
        }

        let started_at = DateTime::parse_from_rfc3339(&session.started_at)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?
            .with_timezone(&Utc);
        let duration_seconds = (Utc::now() - started_at).num_seconds().max(0);
        let ended_at = Utc::now().to_rfc3339();

        self.playtime_repository
            .update_end(&session.id, &ended_at, duration_seconds)?;

        let instance = self.instance_repository.find_by_id(&session.instance_id)?;
        self.instance_repository.update_playtime(
            &session.instance_id,
            instance.playtime_seconds + duration_seconds,
        )?;

        Ok(())
    }

    pub fn get_summary(&self, instance_id: &str) -> Result<PlaytimeSummaryDTO, InstanceError> {
        let instance = self.instance_repository.find_by_id(instance_id)?;
        let latest = self
            .playtime_repository
            .find_latest_by_instance(instance_id)?;
        let open = self
            .playtime_repository
            .find_open_by_instance(instance_id)?;

        // While a session is active, the denormalized total doesn't include it
        // yet: surface it live so the UI can tick up in real time.
        let total_seconds = match open.as_ref() {
            Some(session) => {
                let started_at = DateTime::parse_from_rfc3339(&session.started_at)
                    .map_err(|e| InstanceError::Persistence(e.to_string()))?
                    .with_timezone(&Utc);
                instance.playtime_seconds + (Utc::now() - started_at).num_seconds().max(0)
            }
            None => instance.playtime_seconds,
        };

        Ok(PlaytimeSummaryDTO {
            total_seconds,
            last_played: instance.last_played.clone(),
            last_session_seconds: latest
                .as_ref()
                .and_then(|s| s.ended_at.as_ref().map(|_| s.duration_seconds)),
        })
    }
}
