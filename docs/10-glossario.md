# 10 — Glossário

## Termos Técnicos

| Termo            | Definição                                                                                 |
| ---------------- | ----------------------------------------------------------------------------------------- |
| **Asset**        | Arquivo de áudio, texto ou imagem usado pelo Minecraft (idiomas, sons, etc.)              |
| **CQRS**         | Command Query Responsibility Segregation — separação entre operações de escrita e leitura |
| **DTO**          | Data Transfer Object — objeto para transporte de dados entre camadas                      |
| **Entity**       | Objeto com identidade única e ciclo de vida próprio                                       |
| **Event**        | Notificação de que algo aconteceu no domínio                                              |
| **IPC**          | Inter-Process Communication — comunicação entre frontend e backend via Tauri              |
| **JRE**          | Java Runtime Environment — ambiente para executar aplicações Java                         |
| **Library**      | Dependência Java (.jar) necessária para o Minecraft rodar                                 |
| **Loader**       | Mod loader como Fabric, Quilt ou Forge                                                    |
| **Manifest**     | JSON da Mojang listando versões disponíveis do Minecraft                                  |
| **Rule**         | Condição que determina se uma library deve ser incluída (SO, arch, etc.)                  |
| **Use Case**     | Caso de uso — unidade de lógica de aplicação que orquestra o domínio                      |
| **Value Object** | Objeto imutável definido por seus atributos, não por identidade                           |

## Estruturais

| Termo                    | Definição                                                      |
| ------------------------ | -------------------------------------------------------------- |
| **Application Layer**    | Camada que orquestra casos de uso                              |
| **Domain Layer**         | Camada com regras de negócio e entidades                       |
| **Infrastructure Layer** | Camada com implementações concretas (I/O, rede, arquivos)      |
| **Presentation Layer**   | Camada de comandos Tauri (IPC)                                 |
| **Shared**               | Código compartilhado entre camadas (config, logger, constants) |
| **Feature**              | Unidade funcional no frontend (ex: instances, mods, accounts, skins, settings) |

## Minecraft

| Termo        | Definição                                                              |
| ------------ | ---------------------------------------------------------------------- |
| **Vanilla**  | Minecraft original, sem modificações                                   |
| **Fabric**   | Loader leve e moderno para mods                                        |
| **Quilt**    | Fork do Fabric com foco em comunidade                                  |
| **Forge**    | Loader tradicional para mods pesados                                   |
| **NeoForge** | Fork do Forge pós-controvérsia                                         |
| **Instance** | Instalação isolada do Minecraft com sua própria versão, mods e configs |
| **Runtime**  | Versão específica do Java baixada e gerenciada pelo launcher           |
