# Política de Segurança

## Versões Suportadas

O AstroLauncher ainda está em desenvolvimento ativo, pré-1.0. Só a versão mais recente publicada recebe correções de segurança.

| Versão  | Suportada          |
| ------- | ------------------- |
| 0.2.x   | :white_check_mark: |
| < 0.2   | :x:                 |

## Reportando uma Vulnerabilidade

Encontrou uma vulnerabilidade de segurança? Não abra uma issue pública.

Reporte diretamente pelo perfil do mantenedor, [github.com/kauafpssx](https://github.com/kauafpssx), ou pela aba **Security** do repositório, usando [Report a vulnerability](https://github.com/kauafpssx/AstroLauncher/security/advisories/new). Isso cria um advisory privado, visível só para você e o mantenedor.

Inclua na sua mensagem:

- Descrição da vulnerabilidade e possível impacto
- Passos para reproduzir
- Versão do AstroLauncher afetada
- Sistema operacional usado no teste

### O que esperar

Você recebe uma resposta inicial em até 7 dias confirmando o recebimento do relato. A partir daí, o andamento é comunicado diretamente pelo mesmo canal.

Se a vulnerabilidade for confirmada, uma correção é preparada e publicada assim que possível, junto com uma nova release. Crédito pelo achado é dado publicamente, a menos que você prefira permanecer anônimo.

Se o relato for recusado (não reproduzível, fora do escopo do projeto, ou já conhecido), você recebe uma explicação do motivo.

## Escopo

Cobre o código do AstroLauncher (frontend React, backend Rust, pipeline de build e CI). Não cobre vulnerabilidades em dependências de terceiros, essas devem ser reportadas diretamente ao mantenedor da dependência, e no AstroLauncher via [Dependabot](https://github.com/kauafpssx/AstroLauncher/security/dependabot), que já monitora o repositório.
