# Pixel Breeders File Manager

A Full Stack file management application built with Django, React, and Docker.

---

## 🇧🇷 Versão em Português

### 1. Como Executar (Comando Único)

**Pré-requisitos:** Docker e Docker Compose.

1. Clone o repositório e entre na pasta:

   ```bash
   git clone https://github.com/VandheerLorde/pixel-breeders-file-manager.git
   cd pixel-breeders-file-manager
   ```

2. Crie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

3. Inicie a aplicação:

   ```bash
   docker-compose up --build
   ```

4. Acesse no navegador:
   - **App:** [http://localhost:8080](http://localhost:8080)
   - **Admin:** [http://localhost:8080/admin](http://localhost:8080/admin)

> **Nota:** As migrações do banco de dados rodam automaticamente. Para criar um superusuário para o painel Admin:
> `docker-compose exec backend python manage.py createsuperuser`

### 2. Arquitetura

O sistema utiliza Nginx como gateway para rotear tráfego e gerenciar uploads pesados, garantindo separação limpa entre serviços.

```ascii
+-------------+      +-------------+      +-------------+
|   Cliente   | ---> |    Nginx    | ---> |  Frontend   |
| (Navegador) |      | (Rev Proxy) |      | (React SPA) |
+-------------+      +------+------+      +-------------+
                            |
                            v
                     +-------------+      +-------------+
                     |   Backend   | ---> |    MySQL    |
                     |  (Django)   |      |   (Banco)   |
                     +------+------+      +-------------+
                            |
                            v
                     +-------------+
                     |    MinIO    |
                     | (Arquivos)  |
                     +-------------+
```

### 3. Stack Tecnológica

| Camada             | Tecnologia                             |
| ------------------ | -------------------------------------- |
| **Frontend**       | React 18, TypeScript, MUI, React Query |
| **Backend**        | Django 5, DRF, SimpleJWT               |
| **Banco de Dados** | MySQL 8                                |
| **Storage**        | MinIO (Compatível com S3)              |
| **Infraestrutura** | Docker, Docker Compose, Nginx          |

### 4. Funcionalidades Implementadas

- [x] **Autenticação** (JWT com refresh tokens)
- [x] **Upload de arquivos** (Drag & drop)
- [x] **Validação** (Tipos e tamanhos de arquivo)
- [x] **Listagem** com paginação no servidor
- [x] **Download via stream** (Baixo consumo de memória)
- [x] **Soft delete** (Exclusão lógica recuperável)
- [x] **Links de compartilhamento** (Acesso público via token)
- [x] **Thumbnails** e visualização de imagens
- [x] **Setup Docker Completo** (Startup resiliente)

### 5. Funcionalidades Não Implementadas (Justificativa)

- [ ] **Versionamento de Arquivos**: Adicionaria complexidade significativa ao schema; priorizou-se a robustez das funcionalidades principais.
- [ ] **Cache (Redis)**: A performance da aplicação está otimizada na escala atual; adicionar essa infraestrutura foi considerado desnecessário para o MVP.

### 6. Documentação da API

| Método | Endpoint                    | Descrição              | Auth |
| ------ | --------------------------- | ---------------------- | ---- |
| POST   | `/api/auth/register/`       | Registrar novo usuário | Não  |
| POST   | `/api/auth/token/`          | Login (Obter Token)    | Não  |
| POST   | `/api/auth/token/refresh/`  | Atualizar Token        | Não  |
| GET    | `/api/auth/me/`             | Dados do usuário atual | Sim  |
| GET    | `/api/files/`               | Listar arquivos        | Sim  |
| POST   | `/api/files/upload/`        | Upload de arquivo      | Sim  |
| GET    | `/api/files/{id}/download/` | Download via stream    | Sim  |
| DELETE | `/api/files/{id}/`          | Soft delete            | Sim  |
| POST   | `/api/files/{id}/share/`    | Criar link de partilha | Sim  |
| GET    | `/api/files/{id}/preview/`  | Obter thumbnail        | Sim  |
| GET    | `/api/shared/{token}/`      | Download público       | Não  |

### 7. Estrutura do Projeto

```
.
├── backend/                # Django REST Framework
│   ├── config/             # Configurações (urls, wsgi)
│   ├── apps/               # Apps: 'files', 'users', 'authentication'
│   └── Dockerfile          # Imagem Python com libmagic & lógica wait-for-db
├── frontend/               # React + Vite
│   ├── src/                # Componentes, hooks, pages, api
│   └── Dockerfile          # Build de produção Nginx
├── nginx/
│   └── default.conf        # Config do Gateway (Max upload 10MB)
├── docker-compose.yml      # Orquestração
└── .env.example            # Template de variáveis de ambiente
```

### 8. Arquitetura e Trade-offs

- **JWT vs. Sessões (Server-side):**
  - **Decisão:** Utilização de JWT (JSON Web Tokens).
  - **Trade-off:** A revogação imediata de acesso é mais complexa do que em sessões de banco.
  - **Motivo:** Permite que o backend seja _stateless_, facilitando a escalabilidade horizontal dos containers Docker sem depender de sincronização de sessão ou Redis obrigatório no MVP.

- **Nginx como Proxy Reverso:**
  - **Decisão:** Colocar Nginx à frente do Gunicorn/Django.
  - **Trade-off:** Adiciona complexidade à configuração do Docker Compose.
  - **Motivo:** O servidor de aplicação (Gunicorn) não é otimizado para segurar conexões lentas. O Nginx gerencia o buffer de uploads e downloads, liberando os workers do Django para processar novas requisições rapidamente.

- **MinIO (Self-Hosted) vs. Sistema de Arquivos Local:**
  - **Decisão:** Uso do MinIO (S3 Compatible).
  - **Trade-off:** Maior consumo de memória RAM no ambiente de desenvolvimento.
  - **Motivo:** Simula uma arquitetura Cloud-Native real. Salvar arquivos diretamente no disco do container (`/media`) criaria problemas de persistência e dificultaria a migração futura para AWS/GCP.

- **Streaming Downloads (FileResponse):**
  - **Decisão:** Servir arquivos via fluxo de dados (generators) em vez de carregar em memória.
  - **Trade-off:** Mantém a conexão HTTP aberta por mais tempo durante o download.
  - **Motivo:** Eficiência Crítica de Memória (OOM Prevention). Se um usuário baixasse um arquivo de 1GB carregando-o na RAM, o container do backend travaria. O streaming usa memória constante (~8kb chunks) independente do tamanho do arquivo.

### 9. Melhorias Futuras

Com mais tempo disponível, as seguintes funcionalidades seriam priorizadas:

- Versionamento de arquivos com histórico.
- Organização em pastas/diretórios.
- Cache Redis para metadados de arquivos.
- Operações em massa (Deletar/Baixar múltiplos).
- Funcionalidade de busca e filtros avançados.

---

## 🇺🇸 English Version

### 1. How to Run (Single Command)

**Prerequisites:** Docker and Docker Compose.

1. Clone the repository and enter the directory:

   ```bash
   git clone https://github.com/VandheerLorde/pixel-breeders-file-manager.git
   cd pixel-breeders-file-manager
   ```

2. Create the environment file:

   ```bash
   cp .env.example .env
   ```

3. Start the application:

   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - **App:** [http://localhost:8080](http://localhost:8080)
   - **Admin:** [http://localhost:8080/admin](http://localhost:8080/admin)

> **Note:** Database migrations run automatically. To create a superuser for the Admin panel:
> `docker-compose exec backend python manage.py createsuperuser`

### 2. Architecture

The application uses Nginx as a reverse proxy to route traffic and handle large uploads, ensuring a clean separation between the frontend and backend services.

```ascii
+-------------+      +-------------+      +-------------+
|   Client    | ---> |    Nginx    | ---> |  Frontend   |
|  (Browser)  |      | (Rev Proxy) |      | (React SPA) |
+-------------+      +------+------+      +-------------+
                            |
                            v
                     +-------------+      +-------------+
                     |   Backend   | ---> |    MySQL    |
                     |  (Django)   |      |    (DB)     |
                     +------+------+      +-------------+
                            |
                            v
                     +-------------+
                     |    MinIO    |
                     | (Obj Store) |
                     +-------------+
```

### 3. Tech Stack

| Layer              | Technology                             |
| ------------------ | -------------------------------------- |
| **Frontend**       | React 18, TypeScript, MUI, React Query |
| **Backend**        | Django 5, DRF, SimpleJWT               |
| **Database**       | MySQL 8                                |
| **Storage**        | MinIO (S3-compatible)                  |
| **Infrastructure** | Docker, Docker Compose, Nginx          |

### 4. Features Implemented

- [x] **User authentication** (JWT with refresh tokens)
- [x] **File upload** with drag & drop support
- [x] **File validation** (Type and size limits enforced)
- [x] **File listing** with server-side pagination
- [x] **Streaming downloads** (Low memory usage for large files)
- [x] **Soft delete** (Recoverable deletion)
- [x] **Shareable links** (Public access with unique tokens)
- [x] **Image thumbnails** and instant preview
- [x] **Full Docker setup** (Resilient startup with health checks)

### 5. Features Not Implemented (Reasoning)

- [ ] **File versioning**: Would add significant schema complexity; prioritized robustness of core features.
- [ ] **Caching (Redis)**: Application performance is optimal at current scale; added infrastructure complexity was deemed unnecessary for MVP.

### 6. API Documentation

| Method | Endpoint                    | Description           | Auth |
| ------ | --------------------------- | --------------------- | ---- |
| POST   | `/api/auth/register/`       | Register new user     | No   |
| POST   | `/api/auth/token/`          | Login (Obtain Pair)   | No   |
| POST   | `/api/auth/token/refresh/`  | Refresh Access Token  | No   |
| GET    | `/api/auth/me/`             | Get current user info | Yes  |
| GET    | `/api/files/`               | List user files       | Yes  |
| POST   | `/api/files/upload/`        | Upload file           | Yes  |
| GET    | `/api/files/{id}/download/` | Download file stream  | Yes  |
| DELETE | `/api/files/{id}/`          | Soft delete file      | Yes  |
| POST   | `/api/files/{id}/share/`    | Create share link     | Yes  |
| GET    | `/api/files/{id}/preview/`  | Get thumbnail image   | Yes  |
| GET    | `/api/shared/{token}/`      | Public file download  | No   |

### 7. Project Structure

```
.
├── backend/                # Django REST Framework
│   ├── config/             # Project settings (urls, wsgi)
│   ├── apps/               # Apps: 'files', 'users', 'authentication'
│   └── Dockerfile          # Python image with libmagic & wait-for-db logic
├── frontend/               # React + Vite
│   ├── src/                # Components, hooks, pages, api
│   └── Dockerfile          # Nginx-based production build
├── nginx/
│   └── default.conf        # Gateway config (Max upload 10MB)
├── docker-compose.yml      # Orchestration
└── .env.example            # Environment variables template
```

### 8. Architecture & Trade-offs

- **JWT vs. Server-side Sessions:**
  - **Decision:** JSON Web Tokens (JWT).
  - **Trade-off:** Immediate token revocation is harder compared to database-backed sessions.
  - **Reasoning:** Keeps the backend _stateless_, allowing Docker containers to scale horizontally easily without needing sticky sessions or a mandatory Redis cluster.

- **Nginx Reverse Proxy:**
  - **Decision:** Placing Nginx in front of Gunicorn/Django.
  - **Trade-off:** Increases `docker-compose` complexity.
  - **Reasoning:** Application servers (Gunicorn) are not designed to hold open connections for slow clients. Nginx buffers traffic, releasing Django workers to handle only complete requests.

- **MinIO (Self-Hosted) vs. Local Filesystem:**
  - **Decision:** MinIO (S3 Compatible).
  - **Trade-off:** Higher RAM usage in the dev environment.
  - **Reasoning:** Simulates a real Cloud-Native architecture. Storing files directly on the container disk (`/media`) causes persistence issues and makes future migration to AWS S3 or Google Cloud Storage difficult.

- **Streaming Downloads (FileResponse):**
  - **Decision:** Serving files via data streams (generators) instead of loading into memory.
  - **Trade-off:** Keeps the HTTP connection open for the duration of the transfer.
  - **Reasoning:** Critical Memory Efficiency (OOM Prevention). Loading a 1GB file into RAM would crash the backend container. Streaming uses constant memory (~8kb chunks) regardless of file size.

### 9. Future Improvements

If more time were available, the following would be prioritized:

- File versioning with history tracking.
- Folder organization/directories.
- Redis caching for file metadata.
- Bulk file operations (Delete/Download multiple).
- Search and filter functionality.
