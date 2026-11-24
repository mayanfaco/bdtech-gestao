import { describe, it, expect } from 'vitest';
import {
  proximoToque, aposEnviarToque, cadenciaDasRegras, etapaDeVenda, clientesFechados,
  numeroWhatsapp, linkWhatsapp, preencherScript, ordenarPorUrgencia,
} from './funis.js';
import { buscarAjuda } from '../content/ajuda.js';
import { scriptDoToque, scriptDeAbordagem } from '../content/scripts.js';

const agora = new Date(2026, 10, 23, 10, 0); // 23/11/2026 10h

describe('proximoToque', () => {
  it('calcula o dia do toque a partir da primeira mensagem', () => {
    const t = proximoToque({ followup_passo: 1, followup_inicio: '2026-11-22' }, undefined, agora);
    expect(t.situacao).toBe('hoje');
    expect(t.dia).toBe(1);
  });
  it('marca atrasado e futuro', () => {
    expect(proximoToque({ followup_passo: 2, followup_inicio: '2026-11-20' }, undefined, agora).situacao).toBe('atrasado');
    expect(proximoToque({ followup_passo: 3, followup_inicio: '2026-11-22' }, undefined, agora).diasAte).toBe(3);
  });
  it('ignora quem não está no follow-up', () => {
    expect(proximoToque({ followup_passo: null, followup_inicio: '2026-11-20' })).toBeNull();
    expect(proximoToque({ followup_passo: 7, followup_inicio: '2026-11-20' })).toBeNull();
  });
  it('ordena atrasados primeiro', () => {
    const itens = [
      { id: 'futuro', followup_passo: 6, followup_inicio: '2026-11-22' },
      { id: 'atrasado', followup_passo: 1, followup_inicio: '2026-11-01' },
    ];
    expect(ordenarPorUrgencia(itens, undefined, agora).map((i) => i.id)).toEqual(['atrasado', 'futuro']);
  });
});

describe('aposEnviarToque', () => {
  it('avança um passo', () => {
    expect(aposEnviarToque({ followup_passo: 2 }, { agora }).followup_passo).toBe(3);
  });
  it('lead sem resposta no último toque vai para a geladeira por 60 dias', () => {
    const r = aposEnviarToque({ followup_passo: 6 }, { tipo: 'lead', agora });
    expect(r.funil_etapa).toBe('geladeira');
    expect(r.reativar_em).toBe('2027-01-22');
  });
  it('proposta esgota a cadência', () => {
    expect(aposEnviarToque({ followup_passo: 6 }, { tipo: 'proposta', agora }).followup_passo).toBe(7);
  });
});

describe('cadência e vendas', () => {
  it('lê os dias das regras e completa com o padrão', () => {
    expect(cadenciaDasRegras([{ key: 'followup_toque_2', dias_prazo: 3 }])).toEqual([1, 3, 4, 7, 10, 14]);
  });
  it('agrupa os status da proposta nas colunas', () => {
    expect(etapaDeVenda('visualizada')).toBe('enviada');
    expect(etapaDeVenda('aprovada')).toBe('fechou');
    expect(etapaDeVenda('recusada')).toBe('nao_fechou');
  });
  it('conta cada cliente fechado uma vez só', () => {
    const r = clientesFechados({
      clients: [{ id: 'c1', nome: 'Ed. Sol' }],
      proposals: [{ id: 'p1', client_id: 'c1', status: 'aprovada', created_at: '2026-10-01', valor_total: 1000 }],
      contracts: [{ id: 'k1', client_id: 'c1', status: 'ativo', created_at: '2026-10-05', valor_total: 3000 },
        { id: 'k2', client_id: 'c2', status: 'rascunho', created_at: '2026-10-05' }],
    });
    expect(r).toHaveLength(1);
    expect(r[0]).toMatchObject({ nome: 'Ed. Sol', valor: 3000 });
  });
});

describe('whatsapp e scripts', () => {
  it('formata o número', () => {
    expect(numeroWhatsapp('(85) 99752-3162')).toBe('5585997523162');
    expect(linkWhatsapp('85 99752-3162', 'Oi')).toBe('https://wa.me/5585997523162?text=Oi');
  });
  it('preenche variáveis e lida com nome vazio', () => {
    expect(preencherScript('Olá, {nome}! Sou o {seu_nome}.', { nome: 'Maria Silva', seu_nome: 'Cris' })).toBe('Olá, Maria! Sou o Cris.');
    expect(preencherScript('Olá, {nome}!', {})).toBe('Olá!');
  });
  it('escolhe o script certo', () => {
    expect(scriptDoToque(3).id).toBe('fu-3');
    expect(scriptDoToque(2, 'proposta').id).toBe('pr-2');
    expect(scriptDeAbordagem('Hospital / clínica').id).toBe('abord-hospital');
    expect(scriptDeAbordagem('').id).toBe('abord-condominio');
  });
});

describe('ajuda sem IA', () => {
  it('entende pedidos em linguagem simples', () => {
    expect(buscarAjuda('preciso de ajuda para acompanhar os clientes que eu mandei mensagem')[0].id).toBe('quem-mandei');
    expect(buscarAjuda('quero ver os clientes que eu já tenho')[0].id).toBe('meus-clientes');
    expect(buscarAjuda('como mando zap')[0].id).toBe('mandar-mensagem');
    expect(buscarAjuda('fechei um cliente')[0].id).toBe('fechou');
  });
  it('não quebra com texto vazio', () => {
    expect(buscarAjuda('   ')).toEqual([]);
  });
});

describe('nome com tratamento', () => {
  it('mantém Sr./Sra. junto do nome', () => {
    expect(preencherScript('Oi, {nome}!', { nome: 'Sra. Márcia Lima' })).toBe('Oi, Sra. Márcia!');
    expect(preencherScript('Oi, {nome}!', { nome: 'Sr. Paulo – síndico' })).toBe('Oi, Sr. Paulo!');
    expect(preencherScript('Oi, {nome}!', { nome: 'Marcos – infraestrutura' })).toBe('Oi, Marcos!');
  });
});

import { dataRetomar, estaAdiado, voltouParaAtencao, OPCOES_RETOMAR } from './funis.js';

describe('retomar depois', () => {
  const op = (k) => OPCOES_RETOMAR.find((o) => o.key === k);
  it('calcula as datas rápidas', () => {
    expect(dataRetomar(op('1m'), agora)).toBe('2026-12-23');
    expect(dataRetomar(op('3m'), agora)).toBe('2027-02-23');
    expect(dataRetomar(op('ano'), agora)).toBe('2027-01-04'); // 02/01/2027 é sábado
    expect(dataRetomar(op('1m'), new Date(2027, 0, 31))).toBe('2027-02-28');
  });
  it('separa guardados e os que voltaram', () => {
    expect(estaAdiado({ retomar_em: '2026-12-01' }, agora)).toBe(true);
    expect(estaAdiado({ retomar_em: '2026-11-23' }, agora)).toBe(false);
    expect(voltouParaAtencao({ retomar_em: '2026-11-23' }, agora)).toBe(true);
    expect(voltouParaAtencao({ retomado_em: '2026-11-23T10:00:00Z' }, agora)).toBe(true);
    expect(voltouParaAtencao({}, agora)).toBe(false);
  });
});

describe('ajuda: retomar depois', () => {
  it('encontra pelo jeito de falar', () => {
    expect(buscarAjuda('cliente quer deixar para o próximo ano')[0].id).toBe('retomar-depois');
  });
});
