# Lab 4 — Operation Kaiju Watch · Architecture

Pipeline de données **serverless** pour la détection de menaces Titan.
Fusionne trois flux de données (séismes, thermique satellite, signalements civils)
avec une table de référence (capacité d'évacuation) pour produire un **Titan Threat Report**
classant les zones côtières par niveau de menace.

Services principaux : **Amazon Kinesis · AWS Lambda · Amazon S3 · AWS Glue ·
Amazon Athena · Amazon Redshift · AWS Lake Formation**.

---

## Diagramme d'architecture

```mermaid
flowchart LR
  classDef client    fill:#5A6B87,stroke:#36465A,color:#fff;
  classDef compute   fill:#ED7100,stroke:#b35600,color:#fff;
  classDef analytics fill:#8C4FFF,stroke:#5b2bb0,color:#fff;
  classDef storage   fill:#7AA116,stroke:#55710f,color:#fff;
  classDef govern    fill:#DD344C,stroke:#a3162a,color:#fff;

  SENSORS["Feeds temps réel<br/>séismes · signalements"]:::client
  SAT["Pings thermiques<br/>satellite (batch)"]:::client
  ANALYST["Analyste GTRN<br/>Titan Threat Report"]:::client

  subgraph CLOUD["AWS Cloud — GTRN Threat Pipeline"]

    KIN["Amazon Kinesis<br/>Data Streams"]:::analytics
    ENRICH["AWS Lambda<br/>enrichit · géotague"]:::compute

    subgraph LAKE["Amazon S3 — Data Lake (médaillon)"]
      BRONZE[("Bronze<br/>brut JSON")]:::storage
      SILVER[("Silver<br/>nettoyé Parquet")]:::storage
      GOLD[("Gold<br/>threat scores")]:::storage
    end

    CRAWLER["AWS Glue<br/>Crawler + Data Catalog"]:::analytics
    ETL["AWS Glue ETL<br/>Spark · Bronze→Silver→Gold"]:::analytics
    ATHENA["Amazon Athena<br/>exploration SQL ad-hoc"]:::analytics
    REDSHIFT["Amazon Redshift<br/>Serverless · jointure capacité"]:::analytics
    LF["AWS Lake Formation<br/>masquage colonnes classifiées"]:::govern
    EVAC[("Table de référence<br/>capacité d'évacuation")]:::storage
  end

  SENSORS -->|"1 · stream temps réel"| KIN
  KIN -->|"2 · trigger"| ENRICH
  ENRICH -->|"3 · land brut"| BRONZE
  SAT -->|"3b · drop batch"| BRONZE
  CRAWLER -->|"4 · catalogue"| BRONZE
  CRAWLER -->|"4 · catalogue"| SILVER
  CRAWLER -->|"4 · catalogue"| GOLD
  BRONZE -->|"5 · ETL"| ETL
  ETL -->|"5 · nettoyage"| SILVER
  SILVER -->|"6 · agrégation"| ETL
  ETL -->|"6 · threat scores"| GOLD
  ATHENA -.->|"7 · requête ad-hoc"| SILVER
  ATHENA -.->|"7 · requête ad-hoc"| GOLD
  GOLD -->|"8 · chargement"| REDSHIFT
  EVAC -->|"8b · lookup"| REDSHIFT
  LF -.->|"9 · gouvernance"| GOLD
  LF -.->|"9 · gouvernance"| REDSHIFT
  REDSHIFT -->|"10 · rapport classé"| ANALYST
```

---

## Correspondance flux → domaine d'examen DEA-C01

| # | Étape | Services | Domaine DEA-C01 |
|---|-------|----------|-----------------|
| 1–3 | Ingestion temps réel + batch, enrichissement, atterrissage brut | **Kinesis · Lambda · S3** | Ingestion & Transformation (34 %) |
| 4–6 | Crawl, catalogue, ETL Bronze → Silver → Gold | **Glue (Crawler + ETL)** | Transformation + Data Store (26 %) |
| 7 | Exploration SQL ad-hoc sur le lac | **Athena** | Operations & Support (22 %) |
| 8 | Warehouse + jointure capacité → rapport classé | **Redshift** | Data Store Management (26 %) |
| 9 | Masquage des colonnes classifiées (militaire) | **Lake Formation** | Security & Governance (18 %) |
| 10 | Titan Threat Report (classement d'évacuation) | SQL output | Le livrable final |

---

## Légende des couleurs

| Couleur | Catégorie | Services |
|---|---|---|
| 🟣 Violet | Analytics | Kinesis, Glue, Athena, Redshift |
| 🟠 Orange | Compute | Lambda |
| 🟩 Vert | Storage | S3 |
| 🔴 Rouge | Security & Governance | Lake Formation |
| ⚪ Gris | Client / externe | Capteurs, satellite, analyste |
