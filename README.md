# Pixel Breeders File Manager

A Full Stack file management application built with Django, React, and Docker.

---

🇧🇷

1. Como Executar

Pré-requisitos: Docker e Docker Compose.

    Clone o repositório e entre na pasta:
    Bash

git clone <https://github.com/VandheerLorde/pixel-breeders-file-manager.git>
cd pixel-breeders-file-manager

Crie o arquivo de variáveis de ambiente:
Bash

cp .env.example .env

Inicie a aplicação:
Bash

    docker-compose up --build

    Acesse no navegador:

        App: http://localhost:8080

        Admin: http://localhost:8080/admin

    Nota: As migrações do banco de dados rodam automaticamente. Para criar um superusuário para o painel Admin: docker-compose exec backend python manage.py createsuperuser

2. Arquitetura

O sistema utiliza Nginx como gateway para rotear tráfego e gerenciar uploads pesados, garantindo separação limpa entre serviços.
Snippet de código

+-------------+ +-------------+ +-------------+
| Cliente | ---> | Nginx | ---> | Frontend |
| (Navegador) | | (Rev Proxy) | | (React SPA) |
+-------------+ +------+------+ +-------------+
|
v
+-------------+ +-------------+
| Backend | ---> | MySQL |
| (Django) | | (Banco) |
+------+------+ +-------------+
|
v
+-------------+
| MinIO |
| (Arquivos) |
+-------------+

3. Stack Tecnológica
   Camada Tecnologia
   Frontend React 18, TypeScript, MUI, React Query
   Backend Django 5, DRF, SimpleJWT
   Banco de Dados MySQL 8
   Storage MinIO (Compatível com S3)
   Infraestrutura Docker, Docker Compose, Nginx

4. Funcionalidades Implementadas

   [x] Autenticação (JWT com refresh tokens)

   [x] Upload de arquivos (Drag & drop)

   [x] Validação (Tipos e tamanhos de arquivo)

   [x] Listagem com paginação no servidor

   [x] Download via stream (Baixo consumo de memória)

   [x] Soft delete (Exclusão lógica recuperável)

   [x] Links de compartilhamento (Acesso público via token)

   [x] Thumbnails e visualização de imagens

   [x] Setup Docker Completo (Startup resiliente)

5. Funcionalidades Não Implementadas (Justificativa)

   [ ] Versionamento de Arquivos: Adicionaria complexidade significativa ao schema; priorizou-se a robustez das funcionalidades principais.

   [ ] Cache (Redis): A performance da aplicação está otimizada na escala atual; adicionar essa infraestrutura foi considerado desnecessário para o MVP.

6. Documentação da API
   Método Endpoint Descrição Auth
   POST /api/auth/register/ Registrar novo usuário Não
   POST /api/auth/token/ Login (Obter Token) Não
   POST /api/auth/token/refresh/ Atualizar Token Não
   GET /api/auth/me/ Dados do usuário atual Sim
   GET /api/files/ Listar arquivos Sim
   POST /api/files/upload/ Upload de arquivo Sim
   GET /api/files/{id}/download/ Download via stream Sim
   DELETE /api/files/{id}/ Soft delete Sim
   POST /api/files/{id}/share/ Criar link de partilha Sim
   GET /api/files/{id}/preview/ Obter thumbnail Sim
   GET /api/shared/{token}/ Download público Não
7. Estrutura do Projeto

.
├── backend/ # Django REST Framework
│ ├── config/ # Configurações (urls, wsgi)
│ ├── apps/ # Apps: 'files', 'users', 'authentication'
│ └── Dockerfile # Imagem Python com libmagic & lógica wait-for-db
├── frontend/ # React + Vite
│ ├── src/ # Componentes, hooks, pages, api
│ └── Dockerfile # Build de produção Nginx
├── nginx/
│ └── default.conf # Config do Gateway (Max upload 10MB)
├── docker-compose.yml # Orquestração
└── .env.example # Template de variáveis de ambiente

8. Decisões Técnicas

   MySQL vs PostgreSQL: Escolhido para alinhar com a stack existente da empresa.

   Soft Delete: Implementado em vez de hard delete para prevenir perda acidental e manter rastro de auditoria.

   Integração MinIO: Demonstra conhecimento em object storage compatível com S3 (padrão AWS) mantendo o projeto autossuficiente e offline.

   Downloads via Stream: Utiliza FileResponse do Django para streamar dados, garantindo que o servidor suporte arquivos grandes sem picos de RAM.

   Startup Resiliente: Script personalizado no Docker para lidar com a "Race Condition" entre Django e MySQL, prevenindo falhas na inicialização.

9. Melhorias Futuras

Com mais tempo disponível, as seguintes funcionalidades seriam priorizadas:

    Versionamento de arquivos com histórico.

    Organização em pastas/diretórios.

    Cache Redis para metadados de arquivos.

    Operações em massa (Deletar/Baixar múltiplos).

    Funcionalidade de busca e filtros avançados.

## 🇺🇸

### 1. How to Run (Single Command)

**Prerequisites:** Docker and Docker Compose.

1. Clone the repository and enter the directory:

   ```bash
   git clone <https://github.com/VandheerLorde/pixel-breeders-file-manager.git>
   cd pixel-breeders-file-manager

    Create the environment file:
    Bash
   ```

cp .env.example .env

Start the application:
Bash

    docker-compose up --build

    Access the application:

        App: http://localhost:8080

        Admin: http://localhost:8080/admin

    Note: Database migrations run automatically. To create a superuser for the Admin panel: docker-compose exec backend python manage.py createsuperuser

2. Architecture

The application uses Nginx as a reverse proxy to route traffic and handle large uploads, ensuring a clean separation between the frontend and backend services.
Snippet de código

+-------------+ +-------------+ +-------------+
| Client | ---> | Nginx | ---> | Frontend |
| (Browser) | | (Rev Proxy) | | (React SPA) |
+-------------+ +------+------+ +-------------+
|
v
+-------------+ +-------------+
| Backend | ---> | MySQL |
| (Django) | | (DB) |
+------+------+ +-------------+
|
v
+-------------+
| MinIO |
| (Obj Store) |
+-------------+

3. Tech Stack
   Layer Technology
   Frontend React 18, TypeScript, MUI, React Query
   Backend Django 5, DRF, SimpleJWT
   Database MySQL 8
   Storage MinIO (S3-compatible)
   Infrastructure Docker, Docker Compose, Nginx
4. Features Implemented

   [x] User authentication (JWT with refresh tokens)

   [x] File upload with drag & drop support

   [x] File validation (Type and size limits enforced)

   [x] File listing with server-side pagination

   [x] Streaming downloads (Low memory usage for large files)

   [x] Soft delete (Recoverable deletion)

   [x] Shareable links (Public access with unique tokens)

   [x] Image thumbnails and instant preview

   [x] Full Docker setup (Resilient startup with health checks)

5. Features Not Implemented (Reasoning)

   [ ] File versioning: Would add significant schema complexity; prioritized robustness of core features.

   [ ] Caching (Redis): Application performance is optimal at current scale; added infrastructure complexity was deemed unnecessary for MVP.

6. API Documentation
   Method Endpoint Description Auth
   POST /api/auth/register/ Register new user No
   POST /api/auth/token/ Login (Obtain Pair) No
   POST /api/auth/token/refresh/ Refresh Access Token No
   GET /api/auth/me/ Get current user info Yes
   GET /api/files/ List user files Yes
   POST /api/files/upload/ Upload file Yes
   GET /api/files/{id}/download/ Download file stream Yes
   DELETE /api/files/{id}/ Soft delete file Yes
   POST /api/files/{id}/share/ Create share link Yes
   GET /api/files/{id}/preview/ Get thumbnail image Yes
   GET /api/shared/{token}/ Public file download No
7. Project Structure

.
├── backend/ # Django REST Framework
│ ├── config/ # Project settings (urls, wsgi)
│ ├── apps/ # Apps: 'files', 'users', 'authentication'
│ └── Dockerfile # Python image with libmagic & wait-for-db logic
├── frontend/ # React + Vite
│ ├── src/ # Components, hooks, pages, api
│ └── Dockerfile # Nginx-based production build
├── nginx/
│ └── default.conf # Gateway config (Max upload 10MB)
├── docker-compose.yml # Orchestration
└── .env.example # Environment variables template

8. Technical Decisions

   MySQL over PostgreSQL: Chosen to align with the company's existing tech stack and requirements.

   Soft Delete: Implemented instead of hard delete to prevent accidental data loss and maintain an audit trail.

   MinIO Integration: Demonstrates knowledge of S3-compatible object storage (AWS standard) while keeping the project self-contained and offline-capable.

   Streaming Downloads: Uses Django's FileResponse to stream data, ensuring the server handles large files without RAM spikes.

   Robust Startup: Custom shell script in Docker to handle the race condition between Django and MySQL, preventing startup crashes.

9. Future Improvements

If more time were available, the following would be prioritized:

    File versioning with history tracking.

    Folder organization/directories.

    Redis caching for file metadata.

    Bulk file operations (Delete/Download multiple).

    Search and filter functionality.
