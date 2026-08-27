import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { tituloResumido } from '../../lib/propostaAvulsaParser.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { PropostaAvulsaDocument } from '../../components/propostas/PropostaAvulsaDocument.jsx';
import { PropostaAvulsaToolbar } from '../../components/propostas/PropostaAvulsaToolbar.jsx';
import { injectDocumentEditorLayoutCss } from '../../components/documentEditorLayoutCss.js';
import { BackButton } from '../../components/BackButton.jsx';
import '../../print.css';

injectDocumentEditorLayoutCss();

const EXEMPLO = `PROPOSTA COMERCIAL

Laudo Técnico – Avaliação dos Cabos de Tração de 02 Elevadores

À: [Nome do Condomínio / Cliente]
A/C: [Nome do responsável]
Data: [__/__/____]

1. OBJETO

Descreva aqui o objeto da proposta.

2. ESCOPO DOS SERVIÇOS

Itens contemplados:

* primeiro item;
* segundo item;

3. INVESTIMENTO

Valor total dos serviços: R$ 0,00.

Atenciosamente,`;

export default function PropostaAvulsaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [texto, setTexto] = React.useState('');
  const textareaRef = React.useRef(null);
  const [foco, setFoco] = React.useState(false);
  const [settings, setSettings] = React.useState(null);
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    supabase.from('company_settings').select('*').maybeSingle().then(({ data }) => setSettings(data));
  }, []);

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('standalone_proposals').select('*').eq('id', id).single().then(({ data, error: err }) => {
      if (err) setError(mensagemDeErro(err, { migration: '0009_standalone_proposals.sql' }));
      if (data) setTexto(data.corpo ?? '');
      setLoading(false);
    });
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!texto.trim()) { setError('Cole o texto da proposta antes de salvar.'); return; }
    setSaving(true);
    setError('');

    const { data: userData } = await supabase.auth.getUser();
    const payload = { corpo: texto, titulo: tituloResumido(texto) };

    const result = isEdit
      ? await supabase.from('standalone_proposals').update(payload).eq('id', id).select().single()
      : await supabase.from('standalone_proposals').insert({ ...payload, created_by: userData.user.id }).select().single();

    setSaving(false);
    if (result.error) {
      setError(mensagemDeErro(result.error, { migration: '0009_standalone_proposals.sql' }));
      return;
    }
    navigate(`/propostas/avulsas/${result.data.id}/editar`, { replace: true });
  }

  if (loading) return null;

  return (
    <div className="bd-u-flex-col bd-u-gap-3">
      <BackButton to="/propostas/avulsas" label="Voltar para Propostas avulsas" />
      <div className={`bd-doc-editor ${foco ? 'bd-doc-editor--foco' : ''}`}>
        <form onSubmit={handleSubmit} className="bd-doc-editor__form bd-doc-editor__form--editor">
          <div className="bd-u-flex bd-u-items-center bd-u-justify-between bd-u-gap-3">
            <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Texto da proposta</h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setFoco((f) => !f)}>
              {foco ? 'Mostrar documento' : 'Ampliar editor'}
            </Button>
          </div>

          <PropostaAvulsaToolbar textareaRef={textareaRef} valor={texto} onChange={setTexto} />

          {/* Ocupa toda a altura restante do painel e rola por conta própria. */}
          <div className="bd-doc-editor__fill">
            <Textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Cole aqui o texto da proposta..."
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.55 }}
            />
          </div>

          {!texto.trim() && (
            <Button type="button" variant="outline" size="sm" onClick={() => setTexto(EXEMPLO)}
              style={{ alignSelf: 'flex-start' }}>
              Usar um modelo em branco
            </Button>
          )}

          {error && <Alert tone="danger">{error}</Alert>}

          {/* Recolhida por padrão: a ajuda é longa e roubava espaço do editor. */}
          <details style={{ fontSize: 12, color: 'var(--bd-text-subtle)' }}>
            <summary style={{ cursor: 'pointer', color: 'var(--bd-text-muted)', fontWeight: 600 }}>
              Como formatar
            </summary>
            <div style={{ lineHeight: 1.6, marginTop: 6 }}>
              <strong>Formatação:</strong> selecione o texto e use os botões acima.
              Negrito fica <code>**assim**</code> e itálico <code>*assim*</code>.<br />
              <strong>Estrutura reconhecida:</strong><br />
              &bull; <code>1. OBJETO</code> (em maiúsculas) vira título de seção<br />
              &bull; <code>**OBJETO**</code> (linha toda em negrito) vira título sem número<br />
              &bull; <code>1. primeiro item</code> (texto normal) vira lista numerada<br />
              &bull; linhas com <code>*</code> ou <code>-</code> viram lista com marcadores<br />
              &bull; <code>À:</code>, <code>A/C:</code>, <code>Data:</code> viram o cabeçalho do documento<br />
              &bull; a partir de <code>Atenciosamente,</code> vira assinatura<br />
              O nome do engenheiro, CREA e a marca já entram automaticamente.
            </div>
          </details>

          <div className="bd-doc-editor__form-footer">
            <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Salvar proposta'}</Button>
            {isEdit && (
              <Button variant="outline" as={Link} to={`/propostas/avulsas/${id}/pdf`}>Imprimir / PDF</Button>
            )}
          </div>
        </form>

        <div className="bd-doc-editor__preview">
          <PropostaAvulsaDocument texto={texto} settings={settings} />
        </div>
      </div>
    </div>
  );
}
