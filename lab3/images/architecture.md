# Galerie Imaginaire — Architecture

Application **serverless** de génération d'expositions virtuelles propulsée par
l'IA générative. Le visiteur invente un·e artiste (nom, mouvement, thème) et la
plateforme produit, en moins d'une minute, une exposition complète : un dossier
curatorial (texte), trois œuvres illustrées (images) et un audio-guide (audio).

Services principaux : **Amazon API Gateway · AWS Lambda · AWS Step Functions ·
Amazon Bedrock · Amazon Polly · Amazon DynamoDB · Amazon S3**.

---

## Diagramme d'architecture (workflow)

```mermaid
flowchart LR
    %% ===== Styles par catégorie de service AWS =====
    classDef client   fill:#5A6B87,stroke:#36465A,color:#ffffff,stroke-width:1px;
    classDef network  fill:#8C4FFF,stroke:#5b2bb0,color:#ffffff,stroke-width:1px;
    classDef compute  fill:#ED7100,stroke:#b35600,color:#ffffff,stroke-width:1px;
    classDef appint   fill:#E7157B,stroke:#a50d57,color:#ffffff,stroke-width:1px;
    classDef ml       fill:#01A88D,stroke:#017866,color:#ffffff,stroke-width:1px;
    classDef database fill:#C925D1,stroke:#8e1a94,color:#ffffff,stroke-width:1px;
    classDef storage  fill:#7AA116,stroke:#55710f,color:#ffffff,stroke-width:1px;

    %% ===== Client =====
    USER["🖥️ Navigateur<br/>Galerie web statique"]:::client

    %% ===== AWS Cloud =====
    subgraph CLOUD["AWS Cloud"]
        direction LR

        APIGW["Amazon API Gateway<br/>POST /exhibition · GET /exhibition/{id}"]:::network
        START["AWS Lambda<br/>StartExhibition"]:::compute

        subgraph SFN["AWS Step Functions — state machine"]
            direction TB
            CURATOR["AWS Lambda — Curator<br/>(Amazon Bedrock · texte)<br/>bio + statement + 3 specs d'œuvres"]:::compute

            subgraph PAR["Parallel"]
                direction LR
                subgraph MAP["Map — 3 œuvres (parallèle)"]
                    direction TB
                    PAINTER["AWS Lambda — Painter<br/>(Amazon Bedrock · image)"]:::compute
                end
                AUDIO["AWS Lambda — AudioGuide<br/>(Amazon Polly · narration)"]:::compute
            end

            ASSEMBLE["AWS Lambda — Assemble<br/>statut → READY"]:::compute
        end

        BEDROCK["Amazon Bedrock<br/>LLM texte + modèle image"]:::ml
        POLLY["Amazon Polly<br/>voix-off de l'audio-guide"]:::ml
        DDB[("Amazon DynamoDB<br/>GalerieImaginaire-exhibitions")]:::database
        S3[("Amazon S3<br/>galerie-imaginaire-assets<br/>images + mp3")]:::storage
    end

    %% ===== Flux d'envoi (création de l'exposition) =====
    USER -->|"1 · POST brief<br/>(artist, movement, theme)"| APIGW
    APIGW -->|2 · invoque| START
    START -->|"3 · crée le job (PENDING)"| DDB
    START -->|4 · StartExecution| SFN

    CURATOR -->|5 · génère le dossier| BEDROCK
    CURATOR -->|6 · fan-out| PAR
    PAINTER -->|"7 · génère chaque œuvre"| BEDROCK
    PAINTER -->|8 · dépose les PNG| S3
    AUDIO -->|9 · synthèse vocale| POLLY
    AUDIO -->|10 · dépose le MP3| S3
    PAR --> ASSEMBLE
    ASSEMBLE -->|"11 · résultats + statut READY"| DDB

    %% ===== Flux de récupération (visite de la galerie) =====
    USER -.->|"12 · GET /exhibition/{id}<br/>(polling jusqu'à READY)"| APIGW
    APIGW -.->|13 · lit l'état| DDB
    S3 -.->|"14 · images + audio-guide<br/>(lecture publique)"| USER
```

---

## Déroulé du workflow

### Flux d'envoi — création de l'exposition
1. **Navigateur → API Gateway** : envoi du brief (`artist`, `movement`, `theme`) via `POST /exhibition`.
2. **API Gateway → Lambda StartExhibition** : la requête déclenche la fonction d'entrée.
3. **StartExhibition → DynamoDB** : création de l'enregistrement du job avec le statut `PENDING`.
4. **StartExhibition → Step Functions** : démarrage de l'exécution de la state machine (`StartExecution`).
5. **Curator → Bedrock** : génération du **dossier curatorial** (biographie, *curatorial statement*, et 3 specs d'œuvres `{title, wall_label, image_prompt}`) sous forme de JSON structuré.
6. **Curator → Parallel** : *fan-out* vers les deux branches parallèles.
7. **Painter → Bedrock** : pour chacune des 3 œuvres (état **Map**, en parallèle), génération de l'image dans le style du mouvement choisi.
8. **Painter → S3** : dépôt des 3 fichiers PNG.
9. **AudioGuide → Polly** : synthèse de la narration de l'audio-guide à partir de la bio et du statement.
10. **AudioGuide → S3** : dépôt du fichier MP3.
11. **Assemble → DynamoDB** : assemblage des résultats (URLs images + audio, textes) et passage du statut à `READY`.

### Flux de récupération — visite de la galerie
12. **Navigateur → API Gateway** : `GET /exhibition/{id}` en *polling* jusqu'à ce que le statut soit `READY`.
13. **API Gateway → DynamoDB** : lecture de l'état et des résultats de l'exposition.
14. **S3 → Navigateur** : chargement des œuvres et de l'audio-guide (lecture publique) pour afficher la galerie.

---

## Légende des couleurs (catégories AWS)

| Couleur | Catégorie | Services |
|---|---|---|
| 🟣 Violet | Networking & Content Delivery | Amazon API Gateway |
| 🟠 Orange | Compute | AWS Lambda |
| 🩷 Rose | Application Integration | AWS Step Functions |
| 🟢 Vert d'eau | Machine Learning / AI | Amazon Bedrock, Amazon Polly |
| 🟪 Magenta | Database | Amazon DynamoDB |
| 🟩 Vert | Storage | Amazon S3 |
| ⚪ Gris | Client | Navigateur (galerie web statique) |

> Les flèches **pleines** représentent le flux de **création** de l'exposition (étapes 1→11).
> Les flèches **pointillées** représentent le flux de **récupération / visite** (étapes 12→14).
