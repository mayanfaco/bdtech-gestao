// Converte um valor em reais para texto por extenso (pt-BR), usado no campo
// "valor total por extenso" dos contratos. Autogerado ao digitar o valor,
// mas fica um campo de texto normal — o usuário pode corrigir manualmente
// se necessário, e o valor gravado nunca é regenerado sozinho depois.

const UNIDADES = ['', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const DEZ_A_DEZENOVE = ['dez', 'onze', 'doze', 'treze', 'catorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const DEZENAS = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const CENTENAS = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];
const ESCALAS = ['', 'mil', 'milhão', 'bilhão'];
const ESCALAS_PLURAL = ['', 'mil', 'milhões', 'bilhões'];

function grupoPorExtenso(n) {
  if (n === 0) return '';
  if (n === 100) return 'cem';
  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes = [];
  if (centena > 0) partes.push(CENTENAS[centena]);
  if (resto > 0) {
    if (resto < 10) partes.push(UNIDADES[resto]);
    else if (resto < 20) partes.push(DEZ_A_DEZENOVE[resto - 10]);
    else {
      const dezena = Math.floor(resto / 10);
      const unidade = resto % 10;
      partes.push(unidade === 0 ? DEZENAS[dezena] : `${DEZENAS[dezena]} e ${UNIDADES[unidade]}`);
    }
  }
  return partes.join(' e ');
}

function inteiroPorExtenso(n) {
  if (n === 0) return 'zero';
  const grupos = [];
  let resto = n;
  while (resto > 0) {
    grupos.unshift(resto % 1000);
    resto = Math.floor(resto / 1000);
  }
  const total = grupos.length;
  const partes = [];
  grupos.forEach((g, i) => {
    if (g === 0) return;
    const escalaIndex = total - 1 - i;
    let texto = grupoPorExtenso(g);
    if (escalaIndex === 1) texto = g === 1 ? 'mil' : `${texto} mil`;
    else if (escalaIndex > 1) texto = `${texto} ${g === 1 ? ESCALAS[escalaIndex] : ESCALAS_PLURAL[escalaIndex]}`;
    partes.push({ texto, valor: g });
  });
  if (partes.length === 1) return partes[0].texto;
  const last = partes[partes.length - 1];
  const rest = partes.slice(0, -1).map((p) => p.texto);
  const joiner = (last.valor < 100 || last.valor % 100 === 0) ? ' e ' : ', ';
  return rest.join(', ') + joiner + last.texto;
}

export function numeroPorExtenso(valor) {
  if (valor == null || Number.isNaN(Number(valor))) return '';
  const negativo = valor < 0;
  const abs = Math.abs(Math.round(valor * 100)) / 100;
  const reais = Math.floor(abs);
  const centavos = Math.round((abs - reais) * 100);

  const partes = [];
  if (reais > 0 || centavos === 0) {
    partes.push(`${inteiroPorExtenso(reais)} ${reais === 1 ? 'real' : 'reais'}`);
  }
  if (centavos > 0) {
    partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? 'centavo' : 'centavos'}`);
  }
  const texto = partes.join(' e ');
  return negativo ? `menos ${texto}` : texto;
}
