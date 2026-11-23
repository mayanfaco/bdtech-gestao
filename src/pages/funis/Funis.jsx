import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { proximoToque } from '../../lib/funis.js';
import { useTutorial, FASES } from '../../lib/tutorial.jsx';
import { AvisoMigration } from '../../components/funis/ui.jsx';
import { useFunisDados } from './useFunisDados.js';
import { Prospeccao } from './Prospeccao.jsx';
import { Followup } from './Followup.jsx';
import { Vendas } from './Vendas.jsx';

const ABAS = [
  { key: 'prospeccao', emoji: '🎯', titulo: 'Prospecção', sub: 'Começar conversas' },
  { key: 'followup', emoji: '🔁', titulo: 'Follow-up', sub: 'Cobrar quem não respondeu' },
  { key: 'vendas', emoji: '🤝', titulo: 'Vendas', sub: 'Da proposta ao contrato' },
];

export function Bloqueado({ area }) {
  const fase = FASES.find((f) => f.libera === area);
  return (
    <div className="fx-bloqueado fx-stack" style={{ alignItems: 'center' }}>
      <div className="fx-bloqueado__icone" aria-hidden>🔒</div>
      <h2>Esta parte ainda está trancada</h2>
      <p className="fx-muted" style={{ maxWidth: 460, margin: 0 }}>
        Ela abre quando você terminar a fase <strong>{fase?.titulo}</strong> do tutorial. Leva só alguns minutos e você aprende tudo o que precisa.
      </p>
      <Link className="fx-btn fx-btn--primario fx-btn--lg" to="/tutorial">Ir para o tutorial</Link>
    </div>
  );
}

export function Aviso({ aviso, onFechar }) {
  React.useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(onFechar, 6000);
    return () => clearTimeout(t);
  }, [aviso, onFechar]);
  if (!aviso) return null;
  return (
    <div role="status" className={aviso.tipo === 'erro' ? 'fx-erro' : 'fx-ok'}
      style={{ position: 'fixed', left: '50%', bottom: 96, transform: 'translateX(-50%)', zIndex: 2500, maxWidth: 'calc(100vw - 32px)', boxShadow: '0 10px 30px rgba(1,25,51,.2)', fontWeight: 600 }}>
      {aviso.texto}
    </div>
  );
}

export default function Funis() {
  const { aba = 'prospeccao' } = useParams();
  const navigate = useNavigate();
  const tutorial = useTutorial();
  const dados = useFunisDados();
  const [aviso, setAviso] = React.useState(null);
  const fecharAviso = React.useCallback(() => setAviso(null), []);

  const pendentesHoje = !dados.carregando ? [
    ...dados.leads.filter((l) => l.funil_etapa === 'follow_up'),
    ...dados.propostas.filter((p) => ['enviada', 'visualizada', 'em_negociacao'].includes(p.status)),
  ].filter((i) => { const t = proximoToque(i, dados.cadencia); return t && t.situacao !== 'futuro'; }).length : 0;

  const contagem = {
    prospeccao: dados.leads?.filter((l) => ['para_abordar', 'mensagem_enviada', 'respondeu', 'reuniao'].includes(l.funil_etapa)).length ?? 0,
    followup: pendentesHoje,
    vendas: dados.propostas?.filter((p) => ['enviada', 'visualizada', 'em_negociacao'].includes(p.status)).length ?? 0,
  };

  const props = { dados, recarregar: dados.recarregar, avisar: setAviso };
  const liberada = tutorial.liberado(aba);

  return (
    <div className="fx fx-stack">
      <div className="fx-tabs" role="tablist" aria-label="Funis">
        {ABAS.map((a) => {
          const livre = tutorial.liberado(a.key);
          return (
            <button key={a.key} type="button" role="tab" className="fx-tab" aria-selected={aba === a.key} onClick={() => navigate(`/funis/${a.key}`)}>
              <span className="fx-tab__emoji" aria-hidden>{a.emoji}</span>
              <span className="fx-tab__txt">
                <span className="fx-tab__title">{a.titulo}</span>
                <span className="fx-tab__sub">{a.sub}</span>
              </span>
              {!livre ? <span className="fx-tab__lock" aria-label="Trancado">🔒</span>
                : !dados.carregando && (
                  <span className={`fx-tab__count ${a.key === 'followup' && contagem.followup > 0 ? 'fx-tab__count--alerta' : ''}`}
                    title={a.key === 'followup' ? 'Mensagens para hoje' : 'Em andamento'}>
                    {contagem[a.key]}
                  </span>
                )}
            </button>
          );
        })}
      </div>

      {!liberada ? <Bloqueado area={aba} />
        : dados.carregando ? <div className="fx-muted">Carregando...</div>
          : dados.semMigration ? <AvisoMigration />
            : dados.erro ? <div className="fx-erro">{dados.erro}</div>
              : aba === 'followup' ? <Followup {...props} />
                : aba === 'vendas' ? <Vendas {...props} />
                  : <Prospeccao {...props} />}

      <Aviso aviso={aviso} onFechar={fecharAviso} />
    </div>
  );
}
