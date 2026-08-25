import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient.js';
import { Input } from '../../design-system/components/forms/Input.jsx';
import { Select } from '../../design-system/components/forms/Select.jsx';
import { Button } from '../../design-system/components/buttons/Button.jsx';
import { Alert } from '../../design-system/components/feedback/Alert.jsx';
import { BackButton } from '../../components/BackButton.jsx';
import { nomesProvavelmenteDivergentes } from '../../lib/proposalContato.js';

// --- máscaras (só dígitos, formatação e limite de caracteres) ---
const onlyDigits = (s) => (s || '').replace(/\D/g, '');
function maskCPF(s) {
  return onlyDigits(s).slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}
function maskCNPJ(s) {
  let r = onlyDigits(s).slice(0, 14);
  r = r.replace(/^(\d{2})(\d)/, '$1.$2');
  r = r.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  r = r.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
  r = r.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
  return r;
}
function maskCEP(s) {
  return onlyDigits(s).slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}
const maskDoc = (tipo, v) => (tipo === 'PF' ? maskCPF(v) : maskCNPJ(v));

const EMPTY = {
  tipo_pessoa: 'PJ', nome: '', razao_social: '', cpf_cnpj: '', qtd_elevadores: '',
  cep: '', endereco: '', cidade: '', estado: '',
  sindico_nome: '', sindico_cpf: '',
  contato_nome: '', contato_cargo: '', contato_email: '', whatsapp: '',
  responsavel_user_id: '',
};

// Estilo compacto só deste formulário, para caber sem rolagem.
const COMPACT_CSS = `
.bd-cliente-form .bdctrl{min-height:40px;padding:.45rem .8rem;}
.bd-cliente-form .bdfield{gap:3px;}
.bd-cliente-form .bdfield__label{font-size:12px;}
.bd-cliente-form__sub{font-family:var(--bd-font-display);font-size:12px;font-weight:700;
  color:var(--bd-primary-600);text-transform:uppercase;letter-spacing:.05em;margin-top:var(--bd-space-2);}
`;
if (typeof document !== 'undefined' && !document.getElementById('bd-cliente-form-css')) {
  const s = document.createElement('style'); s.id = 'bd-cliente-form-css'; s.textContent = COMPACT_CSS;
  document.head.appendChild(s);
}

export default function ClienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = React.useState(EMPTY);
  const [loading, setLoading] = React.useState(isEdit);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [cepLoading, setCepLoading] = React.useState(false);

  React.useEffect(() => {
    if (!isEdit) return;
    supabase.from('clients').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...EMPTY, ...data, cpf_cnpj: data.cpf_cnpj ?? data.cnpj ?? '' });
      setLoading(false);
    });
  }, [id, isEdit]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleTipoChange(e) {
    const tipo = e.target.value;
    setForm((f) => ({ ...f, tipo_pessoa: tipo, cpf_cnpj: maskDoc(tipo, f.cpf_cnpj) }));
  }

  async function buscarCep(digits) {
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((f) => ({
          ...f,
          endereco: f.endereco || [data.logradouro, data.bairro].filter(Boolean).join(', '),
          cidade: data.localidade || f.cidade,
          estado: data.uf || f.estado,
        }));
      }
    } catch { /* falha de rede — o usuário preenche manualmente */ }
    setCepLoading(false);
  }

  function handleCepChange(e) {
    const masked = maskCEP(e.target.value);
    setForm((f) => ({ ...f, cep: masked }));
    const digits = onlyDigits(masked);
    if (digits.length === 8) buscarCep(digits);
  }

  function copiarSindicoParaContato() {
    setForm((f) => ({ ...f, contato_nome: f.sindico_nome, contato_cargo: f.contato_cargo || 'Síndico' }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      tipo_pessoa: form.tipo_pessoa,
      nome: form.nome,
      razao_social: form.razao_social,
      cpf_cnpj: form.cpf_cnpj,
      cnpj: form.cpf_cnpj,
      qtd_elevadores: form.qtd_elevadores ? Number(form.qtd_elevadores) : null,
      cep: form.cep,
      endereco: form.endereco,
      cidade: form.cidade,
      estado: form.estado,
      sindico_nome: form.sindico_nome,
      sindico_cpf: form.sindico_cpf,
      contato_nome: form.contato_nome,
      contato_cargo: form.contato_cargo,
      contato_email: form.contato_email,
      contato_telefone: form.whatsapp,
      whatsapp: form.whatsapp,
      responsavel_user_id: form.responsavel_user_id || userData.user.id,
    };
    const result = isEdit
      ? await supabase.from('clients').update(payload).eq('id', id).select().single()
      : await supabase.from('clients').insert({ ...payload, created_by: userData.user.id }).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    navigate(`/clientes/${result.data.id}`);
  }

  // Impede que o Enter em qualquer campo dispare o salvar — só o botão salva.
  function handleKeyDown(e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') e.preventDefault();
  }

  if (loading) return null;

  const isPF = form.tipo_pessoa === 'PF';
  // Avisa quando "Síndico" e "Contato principal" parecem a mesma pessoa com
  // grafias diferentes: é o que faz a proposta sair com o nome desatualizado.
  const nomesDivergem = nomesProvavelmenteDivergentes({
    contatoNome: form.contato_nome, sindicoNome: form.sindico_nome,
  });

  return (
    <div className="bd-u-flex-col bd-u-gap-3" style={{ maxWidth: 920 }}>
      <BackButton to={isEdit ? `/clientes/${id}` : '/clientes'} label={isEdit ? 'Voltar para o cliente' : 'Voltar para Clientes'} />
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="bd-cliente-form bd-u-flex-col bd-u-gap-3">
        <div className="bd-u-grid-2 bd-u-gap-6" style={{ alignItems: 'start' }}>

          <div className="bd-u-flex-col bd-u-gap-3">
            <div className="bd-cliente-form__sub" style={{ marginTop: 0 }}>Informações do condomínio</div>
            <Input label="Nome do Condomínio / Empreendimento" required value={form.nome} onChange={set('nome')} />
            <Select label="Tipo de pessoa" value={form.tipo_pessoa} onChange={handleTipoChange}
              options={[{ value: 'PJ', label: 'Pessoa jurídica (CNPJ)' }, { value: 'PF', label: 'Pessoa física (CPF)' }]} />
            <Input label="Razão social" value={form.razao_social} onChange={set('razao_social')} />
            <div className="bd-u-grid-2 bd-u-gap-4">
              <Input label={isPF ? 'CPF' : 'CNPJ'} inputMode="numeric"
                placeholder={isPF ? '000.000.000-00' : '00.000.000/0000-00'}
                maxLength={isPF ? 14 : 18}
                value={form.cpf_cnpj} onChange={(e) => setForm((f) => ({ ...f, cpf_cnpj: maskDoc(f.tipo_pessoa, e.target.value) }))} />
              <Input label="CEP" inputMode="numeric" placeholder="00000-000" maxLength={9}
                value={form.cep} onChange={handleCepChange}
                hint={cepLoading ? 'Buscando endereço...' : 'Preenche o endereço'} />
            </div>
            <Input label="Endereço completo" value={form.endereco} onChange={set('endereco')} />
            <div className="bd-u-grid-2 bd-u-gap-4">
              <Input label="Cidade" value={form.cidade} onChange={set('cidade')} />
              <Input label="Estado" value={form.estado} onChange={set('estado')} maxLength={2} />
            </div>
            <Input label="Quantidade de elevadores" type="number" min="0" value={form.qtd_elevadores} onChange={set('qtd_elevadores')} />
          </div>

          <div className="bd-u-flex-col bd-u-gap-3">
            <div className="bd-cliente-form__sub" style={{ marginTop: 0 }}>Contato / Síndico</div>
            <Input label="Síndico (nome completo)" value={form.sindico_nome} onChange={set('sindico_nome')} />
            <Input label="CPF do síndico" inputMode="numeric" placeholder="000.000.000-00" maxLength={14}
              value={form.sindico_cpf} onChange={(e) => setForm((f) => ({ ...f, sindico_cpf: maskCPF(e.target.value) }))} />
            <Button type="button" variant="outline" size="sm" onClick={copiarSindicoParaContato} disabled={!form.sindico_nome} style={{ alignSelf: 'flex-start' }}>
              Copiar dados do síndico
            </Button>
            <Input label="Nome do contato principal" value={form.contato_nome} onChange={set('contato_nome')} />
            {nomesDivergem && (
              <Alert tone="warning">
                O nome do síndico e o do contato principal parecem ser da mesma pessoa, escritos de forma
                diferente — provavelmente um foi corrigido e o outro ficou para trás. A proposta usa o
                <strong> contato principal</strong>, então confira qual está certo.
                <div className="bd-u-flex bd-u-gap-2" style={{ marginTop: 'var(--bd-space-3)', flexWrap: 'wrap' }}>
                  <Button type="button" size="sm" variant="outline" onClick={copiarSindicoParaContato}>
                    Usar &ldquo;{form.sindico_nome}&rdquo; nos dois
                  </Button>
                  <Button type="button" size="sm" variant="ghost"
                    onClick={() => setForm((f) => ({ ...f, sindico_nome: f.contato_nome }))}>
                    Usar &ldquo;{form.contato_nome}&rdquo; nos dois
                  </Button>
                </div>
              </Alert>
            )}
            <Input label="Cargo do contato" value={form.contato_cargo} onChange={set('contato_cargo')} />
            <Input label="E-mail" type="email" value={form.contato_email} onChange={set('contato_email')} />
            <Input label="WhatsApp / Contato" value={form.whatsapp} onChange={set('whatsapp')} />
          </div>

        </div>

        {error && <Alert tone="danger">{error}</Alert>}
        <div style={{
          position: 'sticky', bottom: 0, zIndex: 5, marginTop: 'var(--bd-space-2)',
          padding: 'var(--bd-space-4) 0', borderTop: '1px solid var(--bd-border-default)',
          background: 'var(--bd-surface-page)', display: 'flex', gap: 'var(--bd-space-3)',
        }}>
          <Button type="submit" loading={saving}>{isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
