import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { tituloResumido } from '../../lib/propostaAvulsaParser.js';
import { mensagemDeErro } from '../../lib/supabaseErros.js';
import { Textarea } from '../../design-system/components/forms/Textarea.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { PropostaAvulsaDocument } from '../../components/propostas/PropostaAvulsaDocument.jsx';
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
      <div className="bd-doc-editor">
        <form onSubmit={handleSubmit} className="bd-doc-editor__form">
          <div className="bd-doc-editor__form-scroll bd-u-flex-col bd-u-gap-4">
            <h3 style={{ fontFamily: 'var(--bd-font-display)', fontSize: 16 }}>Texto da proposta</h3>
            <p style={{ fontSize: 13, color: 'var(--bd-text-muted)', margin: 0 }}>
              Cole o texto e o documento ao lado se monta com a identidade da BDTECH. Pode editar
              aqui a qualquer momento — o documento acompanha.
            </p>
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              rows={26}
              placeholder="Cole aqui o texto da proposta..."
              style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12.5, lineHeight: 1.5 }}
            />
            {!texto.trim() && (
              <Button type="button" variant="outline" size="sm" onClick={() => setTexto(EXEMPLO)}
                style={{ alignSelf: 'flex-start' }}>
                Usar um modelo em branco
              </Button>
            )}
            <div style={{ fontSize: 12, color: 'var(--bd-text-subtle)', lineHeight: 1.6 }}>
              <strong>O que o sistema reconhece:</strong><br />
              &bull; <code>1. OBJETO</code> vira título de seção<br />
              &bull; linhas com <code>*</code> ou <code>-</code> viram lista<br />
              &bull; <code>À:</code>, <code>A/C:</code>, <code>Data:</code> viram o cabeçalho do documento<br />
              &bull; a partir de <code>Atenciosamente,</code> vira assinatura<br />
              O nome do engenheiro, CREA e a marca já entram automaticamente.
            </div>
            {error && <Alert tone="danger">{error}</Alert>}
          </div>
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
