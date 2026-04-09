import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8MeOV36Wm0ZJocnPFN7x5rNqls-kb4eM",
  authDomain: "sunflower-beauty-maquiagem.firebaseapp.com",
  projectId: "sunflower-beauty-maquiagem",
  storageBucket: "sunflower-beauty-maquiagem.firebasestorage.app",
  messagingSenderId: "616836084056",
  appId: "1:616836084056:web:1c98fda77cbbdaef752d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const POSTS_POR_PAGINA = 6;
let paginaAtual = 1;
let todosUltimosPosts = [];

function escaparHTML(texto = "") {
  return String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cortarTexto(texto = "", limite = 140) {
  const textoLimpo = String(texto).trim();
  if (textoLimpo.length <= limite) return textoLimpo;
  return textoLimpo.slice(0, limite).trimEnd() + "...";
}

function limparMarkdown(texto = "") {
  return String(texto)
    .replace(/\[img:(.*?)\]/gi, " ")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\((.*?)\)/g, "$1")
    .replace(/(^|\s)(#{1,6})\s+/g, "$1")
    .replace(/(\*\*|__|\*|_|~~|`)/g, "")
    .replace(/^>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function transformarDataEmNumero(dataTexto) {
  if (!dataTexto || typeof dataTexto !== "string") return 0;

  const partes = dataTexto.split("/");
  if (partes.length !== 3) return 0;

  const dia = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const ano = Number(partes[2]);

  const data = new Date(ano, mes, dia);
  return data.getTime() || 0;
}

function obterLinkPost(post) {
  if (!post || !post.id) return "#";
  return `post.html?id=${encodeURIComponent(post.id)}`;
}

function obterImagemSegura(imagem, fallback = "imagens/bg.png") {
  if (!imagem || !String(imagem).trim()) return fallback;
  return String(imagem).trim();
}

function normalizarPost(item) {
  const dados = item.data();

  const titulo = dados.titulo || dados.title || "Sem título";
  const descricao = dados.descricao || dados.content || "Post criado pelo admin ✨";
  const categoria = dados.categoria || dados.category || "Post";
  const imagem = dados.imagem || dados.image || "imagens/bg.png";
  const data = dados.data || dados.date || "";
  const views = Number(dados.views || 0);
  const criadoEmNumero = Number(dados.criadoEm || transformarDataEmNumero(data));

  return {
    id: item.id,
    ...dados,
    titulo,
    descricao,
    categoria,
    imagem: obterImagemSegura(imagem),
    data,
    views,
    criadoEmNumero
  };
}

function criarBotaoPagina(numero) {
  const botao = document.createElement("button");
  botao.textContent = numero;

  if (numero === paginaAtual) {
    botao.classList.add("ativo");
  }

  botao.onclick = () => {
    paginaAtual = numero;
    renderizarPostsPaginados();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return botao;
}

function criarReticencias() {
  const span = document.createElement("span");
  span.textContent = "...";
  span.className = "reticencias";
  return span;
}

function montarPaginacao(totalPaginas) {
  const paginacaoPosts = document.getElementById("paginacao-posts");
  if (!paginacaoPosts) return;

  paginacaoPosts.innerHTML = "";

  if (totalPaginas <= 1) return;

  const botaoAnterior = document.createElement("button");
  botaoAnterior.textContent = "‹";
  botaoAnterior.disabled = paginaAtual === 1;
  botaoAnterior.onclick = () => {
    paginaAtual--;
    renderizarPostsPaginados();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  paginacaoPosts.appendChild(botaoAnterior);

  if (totalPaginas <= 7) {
    for (let i = 1; i <= totalPaginas; i++) {
      paginacaoPosts.appendChild(criarBotaoPagina(i));
    }
  } else {
    paginacaoPosts.appendChild(criarBotaoPagina(1));

    if (paginaAtual > 3) {
      paginacaoPosts.appendChild(criarReticencias());
    }

    let inicio = Math.max(2, paginaAtual - 1);
    let fim = Math.min(totalPaginas - 1, paginaAtual + 1);

    if (paginaAtual <= 3) {
      inicio = 2;
      fim = 4;
    }

    if (paginaAtual >= totalPaginas - 2) {
      inicio = totalPaginas - 3;
      fim = totalPaginas - 1;
    }

    for (let i = inicio; i <= fim; i++) {
      paginacaoPosts.appendChild(criarBotaoPagina(i));
    }

    if (paginaAtual < totalPaginas - 2) {
      paginacaoPosts.appendChild(criarReticencias());
    }

    paginacaoPosts.appendChild(criarBotaoPagina(totalPaginas));
  }

  const botaoProximo = document.createElement("button");
  botaoProximo.textContent = "›";
  botaoProximo.disabled = paginaAtual === totalPaginas;
  botaoProximo.onclick = () => {
    paginaAtual++;
    renderizarPostsPaginados();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  paginacaoPosts.appendChild(botaoProximo);
}

function renderizarDestaque(post) {
  const destaqueContainer = document.getElementById("destaque-container");
  if (!destaqueContainer) return;

  if (!post) {
    destaqueContainer.innerHTML = `
      <article class="card-destaque">
        <div class="conteudo-card">
          <span class="tag">Aviso</span>
          <h3>Nenhum destaque ainda</h3>
          <p>Crie posts no admin para aparecer um destaque automático ✨</p>
        </div>
      </article>
    `;
    return;
  }

  const linkPost = obterLinkPost(post);
  const categoria = escaparHTML(post.categoria);
  const titulo = escaparHTML(post.titulo);
  const descricao = escaparHTML(cortarTexto(limparMarkdown(post.descricao), 190));
  const imagem = obterImagemSegura(post.imagem);

  destaqueContainer.innerHTML = `
    <a href="${linkPost}" class="card-link">
      <article class="card-destaque">
        <img src="${imagem}" alt="${titulo}">
        <div class="conteudo-card">
          <span class="tag">${categoria}</span>
          <h3>${titulo}</h3>
          <p>${descricao}</p>
        </div>
      </article>
    </a>
  `;
}

function renderizarPostsPaginados() {
  const postsDinamicos = document.getElementById("posts-dinamicos");
  const paginacaoPosts = document.getElementById("paginacao-posts");

  if (!postsDinamicos) return;

  postsDinamicos.innerHTML = "";

  if (todosUltimosPosts.length === 0) {
    postsDinamicos.innerHTML = `
      <article class="card">
        <div class="conteudo-card">
          <span class="tag">Aviso</span>
          <h3>Nenhum post criado ainda</h3>
          <p>Crie posts no admin para eles aparecerem aqui ✨</p>
        </div>
      </article>
    `;

    if (paginacaoPosts) paginacaoPosts.innerHTML = "";
    return;
  }

  const totalPaginas = Math.ceil(todosUltimosPosts.length / POSTS_POR_PAGINA);

  if (paginaAtual > totalPaginas) {
    paginaAtual = totalPaginas;
  }

  const inicio = (paginaAtual - 1) * POSTS_POR_PAGINA;
  const fim = inicio + POSTS_POR_PAGINA;
  const postsDaPagina = todosUltimosPosts.slice(inicio, fim);

  postsDaPagina.forEach((post) => {
    const linkPost = obterLinkPost(post);
    const categoria = escaparHTML(post.categoria);
    const titulo = escaparHTML(post.titulo);
    const descricao = escaparHTML(cortarTexto(limparMarkdown(post.descricao), 110));
    const imagem = obterImagemSegura(post.imagem);

    postsDinamicos.innerHTML += `
      <a href="${linkPost}" class="card-link">
        <article class="card">
          <img src="${imagem}" alt="${titulo}">
          <div class="conteudo-card">
            <span class="tag">${categoria}</span>
            <h3>${titulo}</h3>
            <p>${descricao}</p>
          </div>
        </article>
      </a>
    `;
  });

  montarPaginacao(totalPaginas);
}

function renderizarMaisVistos(posts) {
  const maisVistosContainer = document.getElementById("mais-vistos-container");
  if (!maisVistosContainer) return;

  maisVistosContainer.innerHTML = "";

  if (posts.length === 0) {
    maisVistosContainer.innerHTML = `
      <div class="mini-post">
        <div class="mini-post-info">
          <span class="tag">Aviso</span>
          <h4>Nenhum post por aqui ainda</h4>
          <p>Abra alguns posts para gerar visualizações 😎</p>
        </div>
      </div>
    `;
    return;
  }

  posts.forEach((post) => {
    const linkPost = obterLinkPost(post);
    const categoria = escaparHTML(post.categoria);
    const titulo = escaparHTML(post.titulo);
    const descricao = escaparHTML(cortarTexto(limparMarkdown(post.descricao), 70));
    const imagem = obterImagemSegura(post.imagem);
    const views = post.views || 0;

    maisVistosContainer.innerHTML += `
      <a href="${linkPost}" class="mini-post-link">
        <div class="mini-post">
          <img src="${imagem}" alt="${titulo}">
          <div class="mini-post-info">
            <span class="tag">${categoria}</span>
            <h4>${titulo}</h4>
            <p>${descricao}</p>
            <p class="mini-post-views">💖 ${views} visualizações</p>
          </div>
        </div>
      </a>
    `;
  });
}

async function carregarPosts() {
  const postsDinamicos = document.getElementById("posts-dinamicos");
  const maisVistosContainer = document.getElementById("mais-vistos-container");
  const paginacaoPosts = document.getElementById("paginacao-posts");

  if (postsDinamicos) postsDinamicos.innerHTML = "";
  if (maisVistosContainer) maisVistosContainer.innerHTML = "";
  if (paginacaoPosts) paginacaoPosts.innerHTML = "";

  let posts = [];

  try {
    const snapshot = await getDocs(collection(db, "posts"));
    snapshot.forEach((item) => {
      posts.push(normalizarPost(item));
    });
  } catch (error) {
    console.error("Erro ao carregar posts do Firebase:", error);

    if (postsDinamicos) {
      postsDinamicos.innerHTML = `
        <article class="card">
          <div class="conteudo-card">
            <span class="tag">Erro</span>
            <h3>Não foi possível carregar os posts</h3>
            <p>Verifique a conexão com o Firebase ✨</p>
          </div>
        </article>
      `;
    }

    if (maisVistosContainer) {
      maisVistosContainer.innerHTML = `
        <div class="mini-post">
          <div class="mini-post-info">
            <span class="tag">Erro</span>
            <h4>Falha ao carregar</h4>
            <p>Confira a configuração do Firebase</p>
          </div>
        </div>
      `;
    }

    return;
  }

  todosUltimosPosts = [...posts].sort((a, b) => b.criadoEmNumero - a.criadoEmNumero);
  paginaAtual = 1;

  renderizarDestaque(todosUltimosPosts[0]);
  renderizarPostsPaginados();

  const postsMaisVistos = [...posts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 5);

  renderizarMaisVistos(postsMaisVistos);
}

window.login = async function () {
  const email = document.getElementById("email")?.value.trim();
  const senha = document.getElementById("senha")?.value;

  try {
    await signInWithEmailAndPassword(auth, email, senha);
    alert("Logado com sucesso 😎");
    window.location.href = "admin.html";
  } catch (error) {
    alert("Erro: " + error.message);
  }
};

window.logout = async function () {
  try {
    await signOut(auth);
    alert("Saiu da conta 👌");
    window.location.href = "index.html";
  } catch (error) {
    alert("Erro ao sair: " + error.message);
  }
};

onAuthStateChanged(auth, (user) => {
  const adminArea = document.getElementById("admin-area");
  if (!adminArea) return;
  adminArea.style.display = user ? "block" : "none";
});

carregarPosts();

document.addEventListener(
  "error",
  (evento) => {
    const alvo = evento.target;
    if (alvo && alvo.tagName === "IMG") {
      alvo.src = "imagens/bg.png";
    }
  },
  true
);