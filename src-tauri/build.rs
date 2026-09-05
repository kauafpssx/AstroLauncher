fn main() {
    tauri_build::build();

    println!("cargo:rerun-if-changed=vendor/cubiomes");

    let mut build = cc::Build::new();
    build.include("vendor/cubiomes");

    // O fork xpple/cubiomes usa C99 (compound literals e designated initializers)
    // que o compilador C da MSVC (cl.exe) não aceita. Usamos clang-cl, que gera
    // object files ABI-compatíveis com MSVC e permite manter o código 100% fiel
    // ao upstream. Preferimos o "clang-cl" que estiver no PATH (portável); caímos
    // para o caminho absoluto padrão do LLVM (Program Files) apenas como fallback.
    if cfg!(target_os = "windows") {
        if let Some(clang_cl) = resolve_clang_cl() {
            build.compiler(clang_cl);
        } else {
            panic!(
                "clang-cl não encontrado no PATH nem no fallback padrão. \
                 Instale o LLVM (winget install -e --id LLVM.LLVM)."
            );
        }
    }

    // Silencia warnings do código vendorizado (não é nosso código — evitamos
    // corrigir a fonte pra manter fidelidade fácil de re-vendorizar do
    // upstream). -Wparentheses: `if unlikely(e = p_elev[i])` em
    // biomenoise.c usa atribuição como condição de propósito (idiomático no
    // C do Cubiomes). -Wdeprecated-declarations: util.c usa fopen/fscanf
    // sem sufixo _s (MSVC/UCRT marca como deprecated), mas são chamadas só
    // em código de depuração/CLI do Cubiomes que não usamos em runtime.
    build.flag_if_supported("-Wno-parentheses");
    build.flag_if_supported("-Wno-deprecated-declarations");

    // AVX2/FMA3 (-mavx2 -mfma) foi testado aqui e revertido: medido 3x em
    // builds limpos (cargo clean -p astrolauncher --release), o cálculo de
    // Overworld ficou ~15-20% MAIS LENTO com AVX2 (9.4-9.5ms/tile) do que
    // sem (7.9-8.3ms/tile), não mais rápido como esperado. Provável causa: o
    // laço quente (sampleBiomeNoise em biomenoise.c) amostra ruído célula a
    // célula chamando uma função grande e cheia de branches/lookups — o
    // autovetorizador do compilador não consegue paralelizar isso só por
    // ativar um ISA mais largo; ganho real exigiria reestruturar o algoritmo
    // (layout SoA + intrinsics explícitos), o que quebraria a fidelidade ao
    // Cubiomes upstream. Não vale subir o requisito mínimo de CPU (Haswell
    // 2013+/Zen 1+) sem ganho de performance — se re-testar no futuro,
    // confirme com `cargo clean -p astrolauncher --release` antes de medir
    // (o cc-rs não recompila arquivos .c só por causa de flags novas se o
    // .c em si não mudou, e comparar contra um build cacheado zera o teste).

    // vendor/cubiomes is a full clone of https://github.com/xpple/cubiomes
    // (see VENDORED_COMMIT.txt for the pinned commit). We only compile the
    // subset needed by this project — extra files (loot/, carver.c, etc.) are
    // present but not listed here, so they have zero build cost.
    let sources = [
        "generator.c",
        "biomenoise.c",
        "biomes.c",
        "finders.c",
        "layers.c",
        "noise.c",
        "util.c",
        "terrainnoise.c",
        "features/end_city.c",
        "features/fortress.c",
        "features/stronghold.c",
        "rust_shim.c",
    ];

    for source in sources {
        build.file(format!("vendor/cubiomes/{source}"));
    }

    build.compile("cubiomes");
}

/// Localiza o `clang-cl` executável: primeiro procurando no PATH, depois no
/// caminho absoluto padrão de instalação do LLVM no Windows.
fn resolve_clang_cl() -> Option<std::path::PathBuf> {
    const FALLBACK: &str = r"C:\Program Files\LLVM\bin\clang-cl.exe";
    let binary = if cfg!(target_os = "windows") {
        "clang-cl.exe"
    } else {
        "clang-cl"
    };

    if let Some(path) = std::env::var_os("PATH") {
        for dir in std::env::split_paths(&path) {
            let candidate = dir.join(binary);
            if candidate.is_file() {
                return Some(candidate);
            }
        }
    }

    let fallback = std::path::Path::new(FALLBACK);
    if fallback.is_file() {
        Some(fallback.to_path_buf())
    } else {
        None
    }
}
