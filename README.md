# Minha Rota — Scanner de Código

App web (funciona no navegador do celular, sem instalação obrigatória) que:
- Lê QR Code e código de barras pela câmera
- Aceita o formato de QR `{"id":"...","t":"lm"}` extraindo o código automaticamente
- Valida que o código tem exatamente 11 dígitos
- Pede o número da parada logo após a leitura
- Ordena a lista pela numeração da parada
- Mostra o total de códigos lidos, com alerta na tela para código inválido ou duplicado
- Salva a lista no próprio celular (continua lá mesmo fechando a página)
- Compartilha a lista pelo WhatsApp
- Agora também é um **PWA** — pode ser "instalado" no Android com ícone próprio

## Arquivos deste repositório

- `index.html` — o app em si
- `manifest.json` — configuração do PWA (nome, ícone, cor)
- `sw.js` — service worker (permite instalar e funcionar offline)
- `icon-192.png` / `icon-512.png` — ícone do app
- `manual.pdf` — manual de uso do app, acessível pelo botão 📖 dentro do app

**Todos esses arquivos precisam estar juntos, na raiz do repositório**, para o PWA
funcionar corretamente.

## Publicar no GitHub Pages (grátis, com https)

1. Envie **todos os arquivos desta pasta** (`index.html`, `manifest.json`, `sw.js`,
   `icon-192.png`, `icon-512.png`) para a raiz do repositório no GitHub — mesmo
   processo de sempre: **Add file → Upload files** → arraste todos → **Commit changes**.
2. Em **Settings → Pages**, confirme que o Pages está ativo (source: branch `main`,
   pasta `/root`).
3. Abra o link `https://seu-usuario.github.io/nome-do-repositorio/` no celular.

## Instalar como app no Android (sem loja, sem apk)

1. Abra o link do app no **Chrome do Android**.
2. Toque no menu (⋮) no canto superior direito.
3. Toque em **"Instalar aplicativo"** (ou "Adicionar à tela inicial").
4. Pronto — o app aparece na tela inicial com ícone próprio, abre em tela cheia,
   sem barra de endereço, como um app nativo.

Isso já resolve a maior parte do "quero um app" sem precisar de loja nem `.apk`.

## Gerar um .apk de verdade (opcional)

Como o app já está publicado com https (GitHub Pages) e tem o `manifest.json` +
`sw.js` certinhos, dá para gerar um `.apk` instalável usando o **PWABuilder**,
uma ferramenta gratuita da Microsoft feita exatamente para isso — eu não
consigo compilar esse `.apk` diretamente aqui, mas o processo é simples:

1. Acesse **https://www.pwabuilder.com** no navegador do computador.
2. Cole o link do seu GitHub Pages (ex: `https://seu-usuario.github.io/nome-do-repositorio/`)
   e clique em **"Start"**.
3. A ferramenta vai analisar o app e mostrar uma pontuação de "PWA readiness".
4. Clique em **"Package for stores"** → escolha **Android**.
5. Ela gera um pacote para download (`.apk` ou `.aab`) já assinado, pronto pra
   instalar no celular (ative "Fontes desconhecidas" no Android para instalar
   fora da Play Store) ou pra publicar na Google Play Store, se quiser distribuir
   oficialmente.

## Atualizando o app depois

Sempre que eu (ou você) alterar algum arquivo, é só subir o arquivo atualizado
no mesmo repositório (substituindo o antigo) — o GitHub Pages atualiza sozinho
em 1–2 minutos. Se o app estiver instalado no celular, ele pode levar até abrir
de novo para buscar a versão nova (o service worker sempre tenta pegar a versão
mais recente primeiro).

## Controle de acesso por chave (venda do app)

O app agora exige uma **chave de acesso com validade** antes de liberar o uso.
Cada chave fica vinculada a um único aparelho automaticamente no primeiro uso.

### 1. Colar as regras de segurança no Firestore

1. No Firebase console, vá em **Databases & Storage → Firestore → Regras** (Rules).
2. Apague o conteúdo atual e cole o conteúdo do arquivo `firestore.rules`
   (está nesta mesma pasta).
3. Clique em **"Publicar"**.

Isso garante que ninguém consiga listar todas as chaves cadastradas nem
alterar o vínculo de aparelho de uma chave já usada — só você, pelo console,
tem esse poder.

### 2. Criar uma chave para um novo cliente

1. No Firebase console, vá em **Databases & Storage → Firestore → Dados**.
2. Clique em **"Iniciar coleção"** (na primeira vez) e digite o nome:
   `chaves`.
3. Em **ID do documento**, digite a própria chave que você vai entregar ao
   cliente — por exemplo `JOAO2026JUL` (pode ser qualquer texto único, sem
   espaços; misture letras e números pra dificultar adivinhação).
4. Adicione os campos do documento:
   - `nome` (tipo **string**) → nome do cliente, só pra sua referência
   - `validade` (tipo **string**) → data no formato `AAAA-MM-DD`, por
     exemplo `2026-08-18` (30 dias a partir de hoje, por exemplo)
   - `ativo` (tipo **boolean**) → `true`
   - `aparelhoId` (tipo **null**) → deixe como nulo (o app preenche sozinho
     no primeiro acesso)
5. Clique em **"Salvar"**.
6. Mande pro cliente, por WhatsApp: o **nome da chave** (ex: `JOAO2026JUL`)
   — ele vai digitar o próprio nome dele e essa chave na primeira tela do
   app.

### 3. Renovar o acesso de um cliente

Quando o cliente pagar de novo:

1. Abra o documento da chave dele em **Firestore → Dados → chaves**.
2. Edite o campo `validade` pra uma nova data (+30 dias, por exemplo).
3. Pronto — no próximo acesso o app já libera de novo, sem precisar mexer
   em mais nada.

Se preferir gerar uma chave **nova** a cada renovação (mais organizado pra
histórico), é só criar um novo documento e mandar a chave nova — nesse caso
o cliente digita a chave nova, que vincula ao mesmo aparelho automaticamente.

### 4. Bloquear ou liberar um aparelho novo

- **Bloquear imediatamente** (ex: cliente não pagou, pediu reembolso): edite
  o campo `ativo` da chave dele pra `false`. No próximo acesso, o app já
  bloqueia e mostra a mensagem de acesso desativado.
- **Cliente trocou de celular**: apague o valor do campo `aparelhoId` (deixe
  nulo de novo) — no próximo acesso, o app vincula ao novo aparelho
  automaticamente.

### Resumo do que cada campo faz

| Campo | Tipo | O que controla |
|---|---|---|
| `nome` | string | Só anotação sua, não afeta o funcionamento |
| `validade` | string `AAAA-MM-DD` | Data limite de uso da chave |
| `ativo` | boolean | Liga/desliga o acesso na hora, independente da validade |
| `aparelhoId` | string ou nulo | Aparelho vinculado — vazio = ainda não usado |
