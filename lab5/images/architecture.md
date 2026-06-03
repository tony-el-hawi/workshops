# Boussole FinOps — Architecture

Système **FinOps multi-agents** propulsé par **Amazon Bedrock AgentCore**. Trois agents
forment une boucle **Voir → Anticiper → Agir** et raisonnent sur le **coût total de
possession** (TCO) en agrégeant les coûts AWS multi-comptes **et** les coûts hors-AWS
(on-premise, licences SaaS).

Services et briques principaux : **Amazon Bedrock AgentCore** (Runtime · Gateway · Memory ·
Identity · Observability · Policy) · **AWS Lambda** · **Amazon SNS** · **AWS Organizations /
Cost & Usage Reports** · **Amazon CloudWatch** · **AWS Trusted Advisor** · **API externe de
licences** · **Amazon EC2 / Amazon RDS**.

---

## Diagramme d'architecture (système multi-agents)

```mermaid
flowchart LR
    %% ===== Styles par catégorie de service AWS =====
    classDef client   fill:#5A6B87,stroke:#36465A,color:#ffffff,stroke-width:1px;
    classDef mgmt     fill:#E7157B,stroke:#a50d57,color:#ffffff,stroke-width:1px;
    classDef compute  fill:#ED7100,stroke:#b35600,color:#ffffff,stroke-width:1px;
    classDef ml       fill:#01A88D,stroke:#017866,color:#ffffff,stroke-width:1px;
    classDef appint   fill:#C925D1,stroke:#8e1a94,color:#ffffff,stroke-width:1px;
    classDef security fill:#DD344C,stroke:#a3162a,color:#ffffff,stroke-width:1px;
    classDef ext      fill:#7AA116,stroke:#55710f,color:#ffffff,stroke-width:1px;

    USER["🧑‍💼 Équipe FinOps Méridian<br/>Inès (CFO) · Tom (FinOps)"]:::client

    subgraph CLOUD["AWS Cloud — région eu-west-1"]
        direction LR

        subgraph CORE["Amazon Bedrock AgentCore"]
            direction TB
            IDENTITY["AgentCore Identity<br/>authentification"]:::security
            POLICY["AgentCore Policy<br/>garde-fous (env=dev)"]:::security
            MEMORY["AgentCore Memory<br/>contexte de session"]:::ml
            OBS["AgentCore Observability<br/>traces → CloudWatch"]:::ml

            subgraph RUNTIME["AgentCore Runtime"]
                direction TB
                ARGUS["Agent Argus<br/>Analyste (lecture seule)"]:::ml
                SIBYLLE["Agent Sibylle<br/>Prévisionniste + alerte"]:::ml
                FAUCON["Agent Faucon<br/>Optimiseur (action)"]:::ml
            end

            GATEWAY["AgentCore Gateway<br/>expose les outils (MCP)"]:::appint
        end

        subgraph TOOLS["Outils (AWS Lambda derrière Gateway)"]
            direction TB
            T_CW["Outil CloudWatch<br/>métriques d'utilisation"]:::compute
            T_TA["Outil Trusted Advisor<br/>checks gratuits"]:::compute
            T_CUR["Outil CUR<br/>coûts & usage"]:::compute
            T_ORG["Outil Organizations<br/>agrégation multi-comptes"]:::compute
            T_LIC["Outil Licences<br/>appel API externe"]:::compute
            T_OP["Outil OnPrem<br/>coûts datacenter (simulé)"]:::compute
            T_NOTIF["Outil Notification<br/>→ Amazon SNS"]:::compute
            T_REM["Outil Remediation<br/>stop EC2 / RDS (env=dev)"]:::compute
        end

        ORG["AWS Organizations<br/>Cost & Usage Reports"]:::mgmt
        CW["Amazon CloudWatch"]:::mgmt
        TA["AWS Trusted Advisor"]:::mgmt
        SNS["Amazon SNS<br/>alertes & validations"]:::appint
        FLEET["Amazon EC2 / RDS<br/>ressources taguées env=dev"]:::compute
    end

    LICAPI["🌐 API externe<br/>licences SaaS / tierces"]:::ext

    %% ===== Flux =====
    USER -->|"1 · question / commande"| IDENTITY
    IDENTITY --> RUNTIME
    ARGUS <-->|2 · contexte| MEMORY
    RUNTIME -->|"3 · appel d'outil"| GATEWAY
    GATEWAY --> TOOLS

    T_CW --> CW
    T_TA --> TA
    T_CUR --> ORG
    T_ORG --> ORG
    T_LIC --> LICAPI
    T_NOTIF --> SNS
    T_REM --> FLEET

    SIBYLLE -->|"4 · projette & alerte"| T_NOTIF
    SNS -.->|5 · alerte / demande de validation| USER
    FAUCON -->|"6 · action sous garde-fous"| POLICY
    POLICY -->|"7 · autorise si env=dev"| T_REM
    RUNTIME -.->|traces| OBS
```

---

## Déroulé du système

1. **Équipe → AgentCore Identity** : la requête (question FinOps ou commande d'optimisation)
   est authentifiée avant tout traitement.
2. **Argus ↔ AgentCore Memory** : l'agent analyste conserve le contexte de la conversation
   pendant la session.
3. **Runtime → Gateway → Outils** : les agents n'accèdent **jamais** directement aux sources ;
   ils invoquent les **outils** exposés via Gateway (CloudWatch, Trusted Advisor, CUR,
   Organizations, Licences, OnPrem, Notification, Remediation).
4. **Sibylle → Outil Notification** : l'agent prévisionniste projette la dépense de fin de
   mois, la compare au budget et **émet une alerte** en cas de dérive.
5. **SNS → Équipe** : l'alerte (et, pour Faucon, la **demande de validation humaine**) est
   transmise à l'équipe.
6. **Faucon → AgentCore Policy** : avant toute action destructrice, l'agent optimiseur passe
   par la couche **Policy**.
7. **Policy → Outil Remediation** : l'action n'est autorisée que si la ressource porte le tag
   `env=dev` ; l'outil arrête alors l'instance EC2/RDS. Toutes les exécutions sont **tracées**
   par AgentCore Observability dans CloudWatch.

---

## Les trois agents (boucle Voir → Anticiper → Agir)

| Agent | Rôle | Nature | Outils principaux |
|---|---|---|---|
| **Argus** | Analyste | Lecture seule | CloudWatch, Trusted Advisor, CUR, Organizations, Licences, OnPrem |
| **Sibylle** | Prévisionniste & alerte | Lecture + notification | CUR, Organizations, Notification (SNS) |
| **Faucon** | Optimiseur | Action sous garde-fous | Remediation (stop EC2/RDS `env=dev`), Notification |

---

## Légende des couleurs (catégories AWS)

| Couleur | Catégorie | Éléments |
|---|---|---|
| 🟢 Vert d'eau | Machine Learning / AI | Agents (Argus, Sibylle, Faucon), AgentCore Memory & Observability |
| 🟠 Orange | Compute | AWS Lambda (outils), Amazon EC2 / RDS |
| 🟪 Magenta | Application Integration | AgentCore Gateway, Amazon SNS |
| 🔴 Rouge | Sécurité, identité & conformité | AgentCore Identity, AgentCore Policy |
| 🩷 Rose | Management & Governance | AWS Organizations / CUR, CloudWatch, Trusted Advisor |
| 🟩 Vert | Hors-AWS | API externe de licences SaaS |
| ⚪ Gris | Client | Équipe FinOps de Méridian |

> Les flèches **pleines** représentent le flux principal (requête → outils → action).
> Les flèches **pointillées** représentent les flux de **notification** et de **traçabilité**.
