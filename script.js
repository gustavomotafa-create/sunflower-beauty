const botoes = document.querySelectorAll(".menu-btn");
const posts = document.querySelectorAll(".post-item");

botoes.forEach((botao) => {
  botao.addEventListener("click", () => {
    botoes.forEach((b) => b.classList.remove("ativo"));
    botao.classList.add("ativo");

    const filtro = botao.getAttribute("data-filtro");

    posts.forEach((post) => {
      const categorias = post.getAttribute("data-categoria");

      if (filtro === "todos" || categorias.includes(filtro)) {
        post.classList.remove("escondido");
      } else {
        post.classList.add("escondido");
      }
    });
  });
});