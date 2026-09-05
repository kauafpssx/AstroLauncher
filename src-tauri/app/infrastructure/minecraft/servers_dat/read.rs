use std::io::{self, Cursor, Read};
use std::path::Path;

use super::*;

mod guards;
mod primitives;

use guards::{checked_len, skip_payload, validate_list};
use primitives::{read_string, read_u8};

fn read_server_compound(r: &mut impl Read) -> io::Result<ServerEntry> {
    let mut entry = ServerEntry::default();
    loop {
        let t = read_u8(r)?;
        if t == TAG_END {
            break;
        }
        let name = read_string(r)?;
        match (t, name.as_str()) {
            (TAG_STRING, "name") => entry.name = read_string(r)?,
            (TAG_STRING, "ip") => entry.ip = read_string(r)?,
            _ => skip_payload(r, t, 1)?,
        }
    }
    Ok(entry)
}

pub fn read_servers(path: &Path) -> io::Result<Vec<ServerEntry>> {
    if !path.exists() {
        return Ok(Vec::new());
    }

    let data = std::fs::read(path)?;
    let mut cursor = Cursor::new(data);

    let root_tag = read_u8(&mut cursor)?;
    if root_tag != TAG_COMPOUND {
        return Ok(Vec::new());
    }
    read_string(&mut cursor)?;

    let mut servers = Vec::new();
    loop {
        let t = read_u8(&mut cursor)?;
        if t == TAG_END {
            break;
        }
        let name = read_string(&mut cursor)?;
        if t == TAG_LIST && name == "servers" {
            let elem_type = read_u8(&mut cursor)?;
            let len = checked_len(&mut cursor)?;
            validate_list(elem_type, len)?;
            for _ in 0..len {
                if elem_type == TAG_COMPOUND {
                    servers.push(read_server_compound(&mut cursor)?);
                } else {
                    skip_payload(&mut cursor, elem_type, 1)?;
                }
            }
        } else {
            skip_payload(&mut cursor, t, 1)?;
        }
    }
    Ok(servers)
}

#[cfg(test)]
#[path = "tests/read_tests.rs"]
mod tests;
