use std::path::PathBuf;

use crate::application::dto::ServerEntryDTO;
use crate::domain::errors::InstanceError;
use crate::infrastructure::minecraft::servers_dat::{self, ServerEntry};

use super::InstanceWorkspaceService;

impl InstanceWorkspaceService {
    fn servers_dat_path(&self, id: &str) -> Result<PathBuf, InstanceError> {
        Ok(self.instance_dir(id)?.join("servers.dat"))
    }

    pub fn list_servers(&self, id: &str) -> Result<Vec<ServerEntryDTO>, InstanceError> {
        let path = self.servers_dat_path(id)?;
        let servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        Ok(servers
            .into_iter()
            .enumerate()
            .map(|(index, s)| ServerEntryDTO {
                index,
                name: s.name,
                ip: s.ip,
            })
            .collect())
    }

    pub fn add_server(&self, id: &str, name: &str, ip: &str) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        servers.push(ServerEntry {
            name: name.to_string(),
            ip: ip.to_string(),
        });
        servers_dat::write_servers(&path, &servers)
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn update_server(
        &self,
        id: &str,
        index: usize,
        name: &str,
        ip: &str,
    ) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        let entry = servers
            .get_mut(index)
            .ok_or_else(|| InstanceError::InvalidName(index.to_string()))?;
        entry.name = name.to_string();
        entry.ip = ip.to_string();
        servers_dat::write_servers(&path, &servers)
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }

    pub fn delete_server(&self, id: &str, index: usize) -> Result<(), InstanceError> {
        let path = self.servers_dat_path(id)?;
        let mut servers = servers_dat::read_servers(&path)
            .map_err(|e| InstanceError::Persistence(e.to_string()))?;
        if index >= servers.len() {
            return Err(InstanceError::InvalidName(index.to_string()));
        }
        servers.remove(index);
        servers_dat::write_servers(&path, &servers)
            .map_err(|e| InstanceError::Persistence(e.to_string()))
    }
}
