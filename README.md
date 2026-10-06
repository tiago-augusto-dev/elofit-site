# EloFit · Site

**Treino, acompanhamento e gestão em um só lugar.**

Frontend do EloFit, projeto de portfólio Full Stack de Tiago Augusto. O personal organiza alunos, prepara treinos e mantém o acompanhamento em uma interface responsiva. Cada aluno pertence a um personal; autorização e isolamento são aplicados pela API.

## Primeira entrega

- Identidade petróleo + lima, logo de halter com elo e componentes MUI personalizados.
- Cadastro e login de personal, logout, recuperação de senha, confirmação de e-mail e ativação de convite do aluno.
- Sessão em cookie HttpOnly, cifrado e autenticado, com renovação de tokens pelo servidor Next.js.
- Dashboard com contagem real de alunos ativos, lista e atalhos.
- Busca, cadastro, edição e perfil do aluno; geração manual de convite.
- Biblioteca de exercícios e prescrição com séries, repetições, carga, descanso e orientações.
- Navegação responsiva, estados de carregamento, erro e ausência de dados, labels e navegação por teclado.
- Login com escolha de Personal ou Aluno e recuperação/confirmação de e-mail por perfil.
- Área do aluno em `/area-aluno`: prescrição, início e retomada de sessões, registro de repetições e carga por série, conclusão de exercícios e treinos e consulta do histórico.

Indicadores e gráficos do estudo visual não são métricas reais e não foram preenchidos com números fictícios na aplicação. Painel do nutricionista, financeiro, evolução, edição/arquivamento de treinos e página pública serão entregas seguintes. O aplicativo React Native continua em um projeto separado.

## Rodar localmente

Use **Node.js 24 LTS** e npm. O Node 20.16 instalado originalmente neste workspace não atende às ferramentas de teste atuais. A implementação foi validada com o Node 24 disponível no runtime do Codex, sem modificar a instalação global.

```powershell
cd elofit-site
npm ci
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Coloque o resultado em `SESSION_SECRET` de `.env.local`. Não versione nem compartilhe esse arquivo. Configure:

```dotenv
BACKEND_URL=http://127.0.0.1:8000
APP_ORIGIN=http://localhost:3000
SESSION_SECRET=<32 bytes em base64>
```

`BACKEND_URL` é obrigatória e define o endereço do backend, sem `/api/v1`. Ela é lida apenas pelo servidor Next.js; o navegador continua usando as rotas do próprio site. Não use o prefixo `NEXT_PUBLIC_`. Reinicie o site após alterar `.env.local`. Não há endereço de API fixo como fallback.

Com a API do repositório `elofit-backend` ativa:

```powershell
npm run dev
```

Abra **http://localhost:3000** e crie uma conta de personal ou use uma existente. `APP_ORIGIN` deve coincidir exatamente com a URL utilizada no navegador. O backend usa por padrão os links `http://localhost:3000/reset-password` e `http://localhost:3000/verify-email`; mantenha-os alinhados caso altere a origem. E-mails de desenvolvimento são capturados pelo Mailpit em http://127.0.0.1:8025.

Para produção local: `npm run build` e `npm start`. Em implantação real, use HTTPS para o cookie Secure, segredo próprio e URL privada do backend.

## Organização

O pacote de logos está em `public/brand`, com versões claras, escuras, transparentes e as pranchas de estudo e cores. Consulte `public/brand/README.md` para escolher o arquivo. O componente `Brand` utiliza as versões com fundo.

```text
src/
  app/                  rotas, layouts e endpoints do servidor Next.js
  components/
    atoms/              identidade visual
    molecules/          cabeçalhos e estados de consulta
    organisms/          navegação
    templates/          estruturas de acesso e painel
  features/
    auth/               formulários de autenticação
    dashboard/          visão geral
    students/           consultas, cadastro e perfil
    training/           exercícios e prescrição
  lib/
    api/                cliente e tipos gerados pelo OpenAPI
    server/             sessão cifrada, comunicação e limites do proxy
  styles/               tema central MUI
tests/                  testes de sessão e fluxo no navegador
```

Atomic Design organiza a interface. Regras de interação, schemas e consultas ficam por funcionalidade. Componentes MUI são usados diretamente quando um wrapper não acrescentaria uma convenção do produto.

O aluno é cadastrado pelo personal e ativa sua senha pelo link do convite, que ainda é compartilhado manualmente. No login, selecione **Aluno**. O proxy permite ao aluno consultar seus treinos e registrar suas execuções; a API aplica o isolamento entre alunos e as regras de inadimplência. O aluno não acessa a gestão de alunos ou a prescrição do personal. Financeiro, dietas e escolha de nutricionista ainda não estão integrados nesta área do site. E-mails locais ficam no Mailpit, sem entrega externa.

Next.js App Router + React + TypeScript; MUI/Emotion com cache SSR; TanStack Query; React Hook Form + Zod; openapi-fetch + openapi-typescript. A tipografia Inter é servida localmente. Recharts está reservado para quando os indicadores reais forem integrados. Não há tokens em localStorage nem variáveis públicas com segredos.

## Contrato e sessão

O navegador chama o mesmo servidor do site. O BFF Next.js acessa a API com os tokens guardados em cookie HttpOnly cifrado (AES-256-GCM), valida a origem das operações mutáveis e limita o proxy às rotas implementadas. Os endpoints de login/refresh devolvem apenas confirmação ao navegador. A API continua responsável pelas permissões, validade da sessão e vínculo do aluno.

O cliente renova uma sessão expirada uma vez e repete a consulta; chamadas concorrentes compartilham a renovação e abas usam Web Locks quando disponível. O servidor coalesce rotações dentro de um processo. **Esta versão requer uma única instância Next.js**; antes de usar réplicas, mover as sessões e o bloqueio de refresh para armazenamento compartilhado. O limitador do backend vê o BFF como origem das chamadas, comportamento que deve ser revisto junto à configuração de proxy em produção.

Erros da API usam `code`, `message`, `request_id` e `details`; a interface traduz os principais códigos sem exibir respostas técnicas ou credenciais. Consulte [a documentação MUI/Next.js](https://mui.com/material-ui/integrations/nextjs/) para a integração do cache de estilos.

Os tipos gerados já estão no repositório. Com o backend como pasta irmã, atualize após mudanças no contrato:

```powershell
npm run api:generate
```

## Verificações

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run test:e2e` exige backend isolado, um servidor Next.js em `E2E_BASE_URL` (padrão porta 3001), `APP_ORIGIN` correspondente, Microsoft Edge instalado e variáveis `E2E_ALLOW_WRITE=1`, `E2E_PASSWORD` com senha de teste de pelo menos 8 caracteres e `E2E_SESSION_SECRET` igual ao segredo desse servidor isolado. Os testes criam registros; não rode contra dados de produção. O cenário confere login, cookie HttpOnly, CSRF, refresh concorrente, isolamento de profissionais, aluno, exercício, prescrição, layout mobile, logout e links reais de e-mail no Mailpit. Capturas ficam em `test-results/`, ignorado pelo Git; traces estão desativados para evitar armazenar credenciais.

O auditor de dependências aponta uma vulnerabilidade transitiva de desenvolvimento em `braces`, trazida pelo ESLint do Next.js. Não havia correção publicada compatível no momento da implementação; `npm audit --omit=dev` deve ser conferido separadamente. Não foi aplicado downgrade do Next.js nem uma versão inexistente para esconder o alerta.

O código está publicado em [tiago-augusto-dev/elofit-site](https://github.com/tiago-augusto-dev/elofit-site). Não são apresentadas métricas inventadas. Marca e domínio ainda precisam ser verificados.

## Validação desta entrega (05/10/2026)

Build de produção, TypeScript e ESLint aprovados; quatro testes de unidade e dois cenários Playwright no Edge aprovados. Os fluxos integrados utilizaram FastAPI/PostgreSQL em banco temporário separado e SMTP local Mailpit. As capturas desktop/mobile foram inspecionadas. O banco e o container de validação foram removidos após os testes; dados de desenvolvimento foram preservados. O CI está configurado, mas não foi executado no GitHub.

### Área do aluno — validação adicional
Cinco testes de unidade aprovados e cenário Playwright do aluno aprovado com PostgreSQL local e dados novos de teste: login por perfil, cookie HttpOnly, bloqueio de acesso a outro aluno e à gestão do personal, início, gravação das séries, conclusão e persistência após recarregar, layout de 390 px e logout. O login da conta de aluno existente também foi conferido no Chrome do usuário. O cenário cria registros com e-mails únicos; utilize ambiente de teste e E2E_BACKEND_URL alinhado ao BACKEND_URL do site.


A visualização do aluno usa cartões numerados sem imagens, dados da prescrição em colunas, orientações expansíveis e contagens reais. O botão de iniciar/continuar fica em painel lateral no desktop e no rodapé fixo no celular. Uma sessão em andamento pode ser retomada após recarregar a página.


Registro e histórico possuem abas próprias. O registro mostra o progresso real, confirma o salvamento de séries e permite recolher exercícios; sessões concluídas são consultadas em modo de leitura. O histórico tem busca, filtro de status, grupos de sessões e paginação visual. Campos não salvos são mantidos ao alternar abas durante a mesma visita; recarregar a página preserva apenas dados salvos. Esta versão consulta todas as páginas de sessões antes de filtrar no navegador.


### Menu da área do aluno

A navegação de Treinos, Registro e Histórico usa ícones, destaque lima na aba ativa e foco visível para teclado. O menu permanece visível durante a rolagem e se adapta ao celular sem rolagem horizontal. Antes de selecionar uma sessão, uma orientação explica como liberar o Registro. A troca de abas continua preservando os campos em edição. O botão de saída inclui ícone e contorno para facilitar sua identificação.

Validação: TypeScript, ESLint e teste integrado de execução e histórico, com capturas em desktop e celular.
