use std::io::{self, Cursor, Read, Write};
use std::path::Path;

#[derive(Debug, Clone, Default)]
pub struct ServerEntry {
    pub name: String,
    pub ip: String,
}

const TAG_END: u8 = 0;
const TAG_BYTE: u8 = 1;
const TAG_SHORT: u8 = 2;
const TAG_INT: u8 = 3;
const TAG_LONG: u8 = 4;
const TAG_FLOAT: u8 = 5;
const TAG_DOUBLE: u8 = 6;
const TAG_BYTE_ARRAY: u8 = 7;
const TAG_STRING: u8 = 8;
const TAG_LIST: u8 = 9;
const TAG_COMPOUND: u8 = 10;
const TAG_INT_ARRAY: u8 = 11;
const TAG_LONG_ARRAY: u8 = 12;

fn read_u8(r: &mut impl Read) -> io::Result<u8> {
    let mut b = [0u8; 1];
    r.read_exact(&mut b)?;
    Ok(b[0])
}

fn read_u16(r: &mut impl Read) -> io::Result<u16> {
    let mut b = [0u8; 2];
    r.read_exact(&mut b)?;
    Ok(u16::from_be_bytes(b))
}

fn read_i32(r: &mut impl Read) -> io::Result<i32> {
    let mut b = [0u8; 4];
    r.read_exact(&mut b)?;
    Ok(i32::from_be_bytes(b))
}

fn read_i64(r: &mut impl Read) -> io::Result<i64> {
    let mut b = [0u8; 8];
    r.read_exact(&mut b)?;
    Ok(i64::from_be_bytes(b))
}

fn read_string(r: &mut impl Read) -> io::Result<String> {
    let len = read_u16(r)? as usize;
    let mut buf = vec![0u8; len];
    r.read_exact(&mut buf)?;
    Ok(String::from_utf8_lossy(&buf).into_owned())
}

/// Reads and discards the payload of a tag whose type we don't care about
/// (icon, acceptTextures, or anything else Minecraft may have written).
fn skip_payload(r: &mut impl Read, tag: u8) -> io::Result<()> {
    match tag {
        TAG_END => {}
        TAG_BYTE => {
            read_u8(r)?;
        }
        TAG_SHORT => {
            read_u16(r)?;
        }
        TAG_INT | TAG_FLOAT => {
            read_i32(r)?;
        }
        TAG_LONG | TAG_DOUBLE => {
            read_i64(r)?;
        }
        TAG_BYTE_ARRAY => {
            let len = read_i32(r)? as usize;
            let mut buf = vec![0u8; len];
            r.read_exact(&mut buf)?;
        }
        TAG_STRING => {
            read_string(r)?;
        }
        TAG_LIST => {
            let elem_type = read_u8(r)?;
            let len = read_i32(r)?;
            for _ in 0..len {
                skip_payload(r, elem_type)?;
            }
        }
        TAG_COMPOUND => loop {
            let t = read_u8(r)?;
            if t == TAG_END {
                break;
            }
            read_string(r)?;
            skip_payload(r, t)?;
        },
        TAG_INT_ARRAY => {
            let len = read_i32(r)? as usize;
            for _ in 0..len {
                read_i32(r)?;
            }
        }
        TAG_LONG_ARRAY => {
            let len = read_i32(r)? as usize;
            for _ in 0..len {
                read_i64(r)?;
            }
        }
        _ => {}
    }
    Ok(())
}

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
            _ => skip_payload(r, t)?,
        }
    }
    Ok(entry)
}

/// Reads Minecraft's `servers.dat` (uncompressed big-endian NBT). Missing
/// file or unreadable root just means "no servers saved yet".
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
    read_string(&mut cursor)?; // root name, always empty in servers.dat

    let mut servers = Vec::new();
    loop {
        let t = read_u8(&mut cursor)?;
        if t == TAG_END {
            break;
        }
        let name = read_string(&mut cursor)?;
        if t == TAG_LIST && name == "servers" {
            let elem_type = read_u8(&mut cursor)?;
            let len = read_i32(&mut cursor)?;
            for _ in 0..len {
                if elem_type == TAG_COMPOUND {
                    servers.push(read_server_compound(&mut cursor)?);
                } else {
                    skip_payload(&mut cursor, elem_type)?;
                }
            }
        } else {
            skip_payload(&mut cursor, t)?;
        }
    }
    Ok(servers)
}

fn write_u8(w: &mut impl Write, v: u8) -> io::Result<()> {
    w.write_all(&[v])
}

fn write_u16(w: &mut impl Write, v: u16) -> io::Result<()> {
    w.write_all(&v.to_be_bytes())
}

fn write_i32(w: &mut impl Write, v: i32) -> io::Result<()> {
    w.write_all(&v.to_be_bytes())
}

fn write_string(w: &mut impl Write, s: &str) -> io::Result<()> {
    let bytes = s.as_bytes();
    write_u16(w, bytes.len() as u16)?;
    w.write_all(bytes)
}

/// Writes `servers.dat` back out. Only `name`/`ip` are preserved — this is
/// the launcher's own CRUD, not a full NBT round-trip, so icon/acceptTextures
/// fields Minecraft would have written are dropped and get regenerated by
/// the game itself the next time it connects.
pub fn write_servers(path: &Path, servers: &[ServerEntry]) -> io::Result<()> {
    let mut buf: Vec<u8> = Vec::new();
    write_u8(&mut buf, TAG_COMPOUND)?;
    write_string(&mut buf, "")?;

    write_u8(&mut buf, TAG_LIST)?;
    write_string(&mut buf, "servers")?;
    write_u8(&mut buf, TAG_COMPOUND)?;
    write_i32(&mut buf, servers.len() as i32)?;
    for server in servers {
        write_u8(&mut buf, TAG_STRING)?;
        write_string(&mut buf, "name")?;
        write_string(&mut buf, &server.name)?;

        write_u8(&mut buf, TAG_STRING)?;
        write_string(&mut buf, "ip")?;
        write_string(&mut buf, &server.ip)?;

        write_u8(&mut buf, TAG_END)?;
    }

    write_u8(&mut buf, TAG_END)?; // end root compound

    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, buf)
}
