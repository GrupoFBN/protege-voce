const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace('<span>protegida desde o dia 1</span>', '<span>proteção desde o dia 1</span>');
html = html.replace('Você fica protegida desde o primeiro dia da contratação.', 'Você tem proteção desde o primeiro dia da contratação.');
html = html.replace('As respostas que toda mulher prática quer ter antes de contratar.', 'As respostas que você precisa ter antes de contratar.');
html = html.replace('Você fica protegida desde o primeiro dia após a contratação.', 'Você tem proteção desde o primeiro dia após a contratação.');
html = html.replace('você é forçada a realizar', 'você sofra coação para realizar');

html = html.replace('<span>O produto é exclusivo para mulheres?</span>', '<span>Quem pode contratar o seguro?</span>');
html = html.replace('Não. A campanha é direcionada ao público feminino, mas a contratação é livre para qualquer pessoa física que queira proteger sua bolsa, mochila, pasta, pochete ou maleta e seus cartões.', 'A contratação é livre para qualquer pessoa física que queira proteger sua bolsa, mochila, pasta, pochete ou maleta, além de seus cartões e demais pertences.');

html = html.replace(
  '<path d="M9 11h6v10H9z"/><path d="M10 7h4v4h-4z"/><path d="M11 3h2v4h-2z"/>',
  '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>'
);
html = html.replace('<h4>Perfume</h4>', '<h4>Fones</h4>');

html = html.replace(
  '<path d="M9 13h6v8H9z"/><path d="M10 9h4l1 4H9z"/><path d="M11 3h2l1 6h-4z"/><path d="M8 21h8"/>',
  '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="2" y1="20" x2="22" y2="20"/>'
);
html = html.replace('<h4>Cosméticos</h4>', '<h4>Notebook</h4>');

html = html.replace('Dos seus cosméticos ao seu celular', 'Do seu notebook ao seu celular');
html = html.replace('Documentos, cartões, cosméticos.', 'Documentos, cartões, eletrônicos.');

fs.writeFileSync('index.html', html, 'utf8');
console.log("Done");