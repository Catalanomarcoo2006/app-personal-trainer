// Chiavi del browser per tema e colore del marchio, e script che li applica
// prima del disegno della pagina (evita il lampo del tema sbagliato).
export const KEY_THEME = "tema";
export const KEY_ACCENT = "colore";

export const appearanceBootScript = `try{var t=localStorage.getItem('${KEY_THEME}');if(t==='dark')document.documentElement.classList.add('dark');var c=localStorage.getItem('${KEY_ACCENT}');if(c)document.documentElement.style.setProperty('--trainer',c)}catch(e){}`;
