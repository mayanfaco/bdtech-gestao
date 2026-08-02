-- DADOS DE DEMONSTRAÇÃO — fictícios, todos marcados com is_demo = true.
-- Rode isto DEPOIS de 0001/0002/0003 e depois de já ter seu usuário
-- vinculado em user_profiles (veja o final de 0002_expansion.sql).
-- Remover tudo isso depois: tela Configurações → Dados de demonstração,
-- ou diretamente: select wipe_demo_data();

do $$
declare
  v_user uuid;
  v_client_solar uuid;
  v_client_peninsula uuid;
  v_client_atlantico uuid;
  v_client_coco uuid;
  v_client_barao uuid;
  v_lead1 uuid;
  v_lead2 uuid;
  v_opp_ganha uuid;
  v_opp_perdida uuid;
  v_opp1 uuid;
  v_proposal1 uuid;
  v_proposal2 uuid;
  v_contract1 uuid;
  v_stage_novo uuid;
  v_stage_qualificacao uuid;
  v_stage_proposta_enviada uuid;
  v_stage_negociacao uuid;
  v_stage_ganho uuid;
  v_stage_perdido uuid;
begin
  select id into v_user from user_profiles limit 1;
  if v_user is null then
    raise exception 'Nenhum user_profiles encontrado — crie e vincule seu usuário administrador antes de rodar o seed (veja o final de 0002_expansion.sql).';
  end if;

  select id into v_stage_novo from pipeline_stages where key = 'novo_lead';
  select id into v_stage_qualificacao from pipeline_stages where key = 'qualificacao';
  select id into v_stage_proposta_enviada from pipeline_stages where key = 'proposta_enviada';
  select id into v_stage_negociacao from pipeline_stages where key = 'negociacao';
  select id into v_stage_ganho from pipeline_stages where key = 'ganho';
  select id into v_stage_perdido from pipeline_stages where key = 'perdido';

  -- ---------- Clientes ----------
  insert into clients (nome, cpf_cnpj, cnpj, endereco, cidade, estado, sindico_nome, contato_nome, contato_cargo, contato_email, contato_telefone, qtd_elevadores, status_relacionamento, responsavel_user_id, created_by, is_demo)
    values ('Edifício Solar das Dunas', '12.345.678/0001-01', '12.345.678/0001-01', 'Av. Beira Mar, 1200, Meireles', 'Fortaleza', 'CE', 'Roberto Sampaio', 'Roberto Sampaio', 'Síndico', 'sindico@solardasdunas.example', '(85) 99900-1001', 4, 'ativo', v_user, v_user, true)
    returning id into v_client_solar;
  insert into clients (nome, cpf_cnpj, cnpj, endereco, cidade, estado, sindico_nome, contato_nome, contato_cargo, contato_email, contato_telefone, qtd_elevadores, status_relacionamento, responsavel_user_id, created_by, is_demo)
    values ('Condomínio Residencial Península', '23.456.789/0001-02', '23.456.789/0001-02', 'Rua dos Tabajaras, 500, Meireles', 'Fortaleza', 'CE', 'Ana Beatriz Coelho', 'Ana Beatriz Coelho', 'Síndica', 'sindica@peninsula.example', '(85) 99900-1002', 6, 'ativo', v_user, v_user, true)
    returning id into v_client_peninsula;
  insert into clients (nome, cpf_cnpj, cnpj, endereco, cidade, estado, sindico_nome, contato_nome, contato_cargo, contato_email, contato_telefone, qtd_elevadores, status_relacionamento, responsavel_user_id, created_by, is_demo)
    values ('Edifício Atlântico Tower', '34.567.890/0001-03', '34.567.890/0001-03', 'Av. Presidente Kennedy, 3400, Praia de Iracema', 'Fortaleza', 'CE', 'Marcelo Aragão', 'Marcelo Aragão', 'Síndico', 'sindico@atlantictower.example', '(85) 99900-1003', 2, 'ativo', v_user, v_user, true)
    returning id into v_client_atlantico;
  insert into clients (nome, cpf_cnpj, cnpj, endereco, cidade, estado, sindico_nome, contato_nome, contato_cargo, contato_email, contato_telefone, qtd_elevadores, status_relacionamento, responsavel_user_id, created_by, is_demo)
    values ('Residencial Cocó Garden', '45.678.901/0001-04', '45.678.901/0001-04', 'Rua Escritor Lourenço Filho, 88, Cocó', 'Fortaleza', 'CE', 'Fernanda Lima', 'Fernanda Lima', 'Síndica', 'sindica@cocogarden.example', '(85) 99900-1004', 3, 'prospect', v_user, v_user, true)
    returning id into v_client_coco;
  insert into clients (nome, cpf_cnpj, cnpj, endereco, cidade, estado, sindico_nome, contato_nome, contato_cargo, contato_email, contato_telefone, qtd_elevadores, status_relacionamento, responsavel_user_id, created_by, is_demo)
    values ('Condomínio Empresarial Barão Business Center', '56.789.012/0001-05', '56.789.012/0001-05', 'Rua Barão do Rio Branco, 1500, Centro', 'Fortaleza', 'CE', 'Carlos Eduardo Pinto', 'Carlos Eduardo Pinto', 'Síndico profissional', 'sindico@baraobusiness.example', '(85) 99900-1005', 8, 'ativo', v_user, v_user, true)
    returning id into v_client_barao;

  -- ---------- Contatos adicionais ----------
  insert into client_contacts (client_id, nome, cargo, telefone, email, principal, is_demo)
    values (v_client_solar, 'Juliana Prado', 'Zeladora', '(85) 99900-2001', 'zeladoria@solardasdunas.example', false, true);
  insert into client_contacts (client_id, nome, cargo, telefone, email, principal, is_demo)
    values (v_client_barao, 'Empresa ADM Predial Ltda', 'Administradora', '(85) 3200-3000', 'contato@admpredial.example', false, true);

  -- ---------- Leads ----------
  insert into leads (nome, empresa, telefone, email, origem, servico_interesse, responsavel_user_id, status, created_by, is_demo)
    values ('Patrícia Nogueira', 'Edifício Vila Rica', '(85) 99900-3001', 'patricia@vilarica.example', 'Indicação', 'Consultoria Técnica Anual', v_user, 'novo', v_user, true)
    returning id into v_lead1;
  insert into leads (nome, empresa, telefone, email, origem, servico_interesse, responsavel_user_id, status, created_by, is_demo)
    values ('Ricardo Uchôa', 'Edifício Costa Azul', '(85) 99900-3002', 'ricardo@costaazul.example', 'Site', 'Vistoria Técnica Pontual', v_user, 'em_contato', v_user, true)
    returning id into v_lead2;
  insert into leads (nome, empresa, telefone, email, origem, servico_interesse, responsavel_user_id, status, created_by, is_demo)
    values ('Simone Bezerra', 'Condomínio Recanto Verde', '(85) 99900-3003', 'simone@recantoverde.example', 'Instagram', 'RIA', v_user, 'qualificado', v_user, true);
  insert into leads (nome, empresa, telefone, email, origem, servico_interesse, responsavel_user_id, status, created_by, is_demo)
    values ('Tiago Farias', 'Edifício Mirante do Mucuripe', '(85) 99900-3004', 'tiago@mirantemucuripe.example', 'Ligação direta', 'Auditoria de contrato de manutenção', v_user, 'novo', v_user, true);
  insert into leads (nome, empresa, telefone, email, origem, servico_interesse, responsavel_user_id, status, converted_client_id, converted_at, created_by, is_demo)
    values ('Roberto Sampaio', 'Edifício Solar das Dunas', '(85) 99900-1001', 'sindico@solardasdunas.example', 'Indicação', 'Consultoria Técnica Anual', v_user, 'convertido', v_client_solar, now() - interval '60 days', v_user, true);
  insert into leads (nome, empresa, telefone, email, origem, servico_interesse, responsavel_user_id, status, created_by, is_demo)
    values ('Helena Castro', 'Edifício Praia Bela', '(85) 99900-3006', 'helena@praiabela.example', 'Indicação', 'Vistoria Técnica Pontual', v_user, 'descartado', v_user, true);

  -- ---------- Oportunidades ----------
  insert into opportunities (client_id, titulo, servico_tipo, valor_estimado, probabilidade_percentual, previsao_fechamento, responsavel_user_id, origem, stage_id, status, ganha_em, created_by, is_demo)
    values (v_client_barao, 'Consultoria Anual — Barão Business Center', 'Consultoria Técnica Anual', 6600, 100, current_date - 30, v_user, 'Indicação', v_stage_ganho, 'ganha', now() - interval '35 days', v_user, true)
    returning id into v_opp_ganha;
  insert into opportunities (client_id, titulo, servico_tipo, valor_estimado, probabilidade_percentual, previsao_fechamento, responsavel_user_id, origem, stage_id, status, motivo_perda, perdida_em, created_by, is_demo)
    values (v_client_coco, 'Vistoria Pontual — Cocó Garden', 'Vistoria Técnica Pontual', 2800, 0, current_date - 10, v_user, 'Site', v_stage_perdido, 'perdida', 'Condomínio optou por manter apenas a manutenção atual, sem consultoria independente por ora.', now() - interval '12 days', v_user, true)
    returning id into v_opp_perdida;
  insert into opportunities (client_id, titulo, servico_tipo, valor_estimado, probabilidade_percentual, previsao_fechamento, responsavel_user_id, origem, stage_id, status, created_by, is_demo)
    values (v_client_peninsula, 'Consultoria Anual — Residencial Península', 'Consultoria Técnica Anual', 7200, 60, current_date + 20, v_user, 'Indicação', v_stage_negociacao, 'aberta', v_user, true)
    returning id into v_opp1;
  insert into opportunities (client_id, titulo, servico_tipo, valor_estimado, probabilidade_percentual, previsao_fechamento, responsavel_user_id, origem, stage_id, status, created_by, is_demo)
    values (v_client_atlantico, 'Vistoria Pontual — Atlântico Tower', 'Vistoria Técnica Pontual', 2310, 40, current_date + 15, v_user, 'Indicação', v_stage_proposta_enviada, 'aberta', v_user, true);
  insert into opportunities (lead_id, titulo, servico_tipo, valor_estimado, probabilidade_percentual, responsavel_user_id, origem, stage_id, status, created_by, is_demo)
    values (v_lead2, 'Vistoria Pontual — Edifício Costa Azul', 'Vistoria Técnica Pontual', 2500, 20, v_user, 'Site', v_stage_qualificacao, 'aberta', v_user, true);

  -- ---------- Propostas ----------
  insert into proposals (client_id, numero, data_proposta, qtd_elevadores, desconto_percentual, modelo1_valor_com_desconto, modelo1_entrada_percentual, status, responsavel_user_id, created_by, sent_at, is_demo)
    values (v_client_atlantico, nextval('proposals_numero_seq'), current_date - 5, 2, 10, 2310, 50, 'enviada', v_user, v_user, now() - interval '5 days', true)
    returning id into v_proposal1;
  insert into proposals (client_id, numero, data_proposta, qtd_elevadores, desconto_percentual, modelo2_valor_com_desconto_mensal, modelo2_entrada_percentual, modelo2_parcelas_restante, status, responsavel_user_id, created_by, sent_at, converted_at, is_demo)
    values (v_client_barao, nextval('proposals_numero_seq'), current_date - 40, 8, 10, 550, 0, 12, 'aprovada', v_user, v_user, now() - interval '40 days', now() - interval '35 days', true)
    returning id into v_proposal2;
  insert into proposals (client_id, numero, data_proposta, qtd_elevadores, desconto_percentual, modelo1_valor_com_desconto, modelo1_entrada_percentual, status, responsavel_user_id, created_by, is_demo)
    values (v_client_coco, nextval('proposals_numero_seq'), current_date - 15, 3, 5, 2800, 50, 'recusada', v_user, v_user, true);
  insert into proposals (client_id, numero, data_proposta, qtd_elevadores, desconto_percentual, modelo2_valor_com_desconto_mensal, modelo2_entrada_percentual, modelo2_parcelas_restante, status, responsavel_user_id, created_by, data_validade, is_demo)
    values (v_client_peninsula, nextval('proposals_numero_seq'), current_date - 3, 6, 12, 611, 0, 12, 'em_negociacao', v_user, v_user, current_date + 12, true);
  insert into proposals (client_id, numero, data_proposta, qtd_elevadores, desconto_percentual, modelo1_valor_com_desconto, modelo1_entrada_percentual, status, responsavel_user_id, created_by, is_demo)
    values (v_client_solar, nextval('proposals_numero_seq'), current_date - 90, 4, 10, 3300, 50, 'expirada', v_user, v_user, true);
  insert into proposals (client_id, numero, data_proposta, qtd_elevadores, desconto_percentual, modelo1_valor_com_desconto, modelo1_entrada_percentual, status, responsavel_user_id, created_by, is_demo)
    values (v_client_solar, nextval('proposals_numero_seq'), current_date - 1, 4, 10, 2970, 50, 'rascunho', v_user, v_user, true);

  -- ---------- Contratos ----------
  insert into contracts (client_id, proposal_id, modelo, contratante_nome, contratante_cnpj, contratante_endereco, contratante_sindico_nome,
      contratada_razao_social, contratada_cnpj, contratada_endereco, contratada_representante, contratada_cpf,
      escopo_servico, data_inicio, data_termino, valor_total, valor_total_extenso, status, responsavel_user_id, created_by, is_demo)
    select v_client_barao, v_proposal2, 'modelo2', 'Condomínio Empresarial Barão Business Center', c.cpf_cnpj, c.endereco, c.sindico_nome,
      cs.razao_social, cs.cnpj, cs.endereco, cs.representante_legal, cs.representante_cpf,
      'Serviço Técnico Continuado — consultoria técnica anual em elevadores.', current_date - 30, current_date + 335, 6600,
      'seis mil e seiscentos reais', 'ativo', v_user, v_user, true
    from clients c, company_settings cs where c.id = v_client_barao
    returning id into v_contract1;

  insert into contracts (client_id, modelo, contratante_nome, contratante_cnpj, contratante_endereco, contratante_sindico_nome,
      contratada_razao_social, contratada_cnpj, contratada_endereco, contratada_representante, contratada_cpf,
      escopo_servico, data_inicio, data_termino, valor_total, valor_total_extenso, status, responsavel_user_id, created_by, is_demo)
    select v_client_solar, 'modelo1', 'Edifício Solar das Dunas', c.cpf_cnpj, c.endereco, c.sindico_nome,
      cs.razao_social, cs.cnpj, cs.endereco, cs.representante_legal, cs.representante_cpf,
      'Serviço Técnico Pontual — vistoria e RIA.', current_date - 300, current_date + 20, 3300,
      'três mil e trezentos reais', 'proximo_vencimento', v_user, v_user, true
    from clients c, company_settings cs where c.id = v_client_solar;

  -- ---------- Eventos de agenda ----------
  insert into calendar_events (titulo, tipo, data_inicio, data_fim, local, status, client_id, responsavel_user_id, created_by, is_demo) values
    ('Vistoria técnica — Atlântico Tower', 'vistoria', now() - interval '10 days', now() - interval '10 days' + interval '2 hours', 'Av. Presidente Kennedy, 3400', 'realizado', v_client_atlantico, v_user, v_user, true),
    ('Reunião comercial — Residencial Península', 'reuniao_comercial', now() + interval '2 days', now() + interval '2 days' + interval '1 hour', 'Rua dos Tabajaras, 500', 'confirmado', v_client_peninsula, v_user, v_user, true),
    ('Apresentação de proposta — Cocó Garden', 'apresentacao_proposta', now() - interval '16 days', now() - interval '16 days' + interval '1 hour', 'Rua Escritor Lourenço Filho, 88', 'realizado', v_client_coco, v_user, v_user, true),
    ('Follow-up — Solar das Dunas', 'follow_up', now() + interval '1 day', now() + interval '1 day' + interval '30 minutes', null, 'agendado', v_client_solar, v_user, v_user, true),
    ('Vistoria técnica — Barão Business Center', 'vistoria', now() + interval '5 days', now() + interval '5 days' + interval '3 hours', 'Rua Barão do Rio Branco, 1500', 'agendado', v_client_barao, v_user, v_user, true),
    ('Reunião interna — planejamento mensal', 'reuniao_interna', now() + interval '3 days', now() + interval '3 days' + interval '1 hour', 'Escritório BDTECH', 'agendado', null, v_user, v_user, true),
    ('Visita ao cliente — Edifício Costa Azul', 'visita_cliente', now() + interval '4 days', now() + interval '4 days' + interval '1 hour', null, 'agendado', null, v_user, v_user, true);

  -- ---------- Tarefas ----------
  insert into tasks (titulo, descricao, responsavel_user_id, prioridade, prazo, status, client_id, proposal_id, created_by, is_demo) values
    ('Fazer follow-up: proposta Atlântico Tower', 'Ligar para confirmar recebimento da proposta.', v_user, 'alta', now() + interval '2 days', 'pendente', v_client_atlantico, v_proposal1, v_user, true),
    ('Preparar RIA — Barão Business Center', 'Elaborar relatório de inspeção anual.', v_user, 'urgente', now() - interval '1 day', 'pendente', v_client_barao, null, v_user, true),
    ('Revisar contrato antes de enviar — Península', null, v_user, 'media', now() + interval '4 days', 'em_andamento', v_client_peninsula, null, v_user, true),
    ('Cobrar assinatura do contrato — Solar das Dunas', null, v_user, 'alta', now() + interval '3 days', 'pendente', v_client_solar, null, v_user, true),
    ('Atualizar cadastro do síndico — Cocó Garden', null, v_user, 'baixa', now() + interval '10 days', 'pendente', v_client_coco, null, v_user, true),
    ('Confirmar vistoria de amanhã — Solar das Dunas', null, v_user, 'media', now() + interval '20 hours', 'pendente', v_client_solar, null, v_user, true),
    ('Emitir nota fiscal — Barão Business Center', null, v_user, 'media', now() + interval '5 days', 'pendente', v_client_barao, null, v_user, true),
    ('Arquivar proposta recusada — Cocó Garden', null, v_user, 'baixa', now() + interval '15 days', 'concluida', v_client_coco, null, v_user, true);

  -- ---------- Timeline manual (algumas anotações de exemplo) ----------
  insert into activity_log (entity_type, entity_id, activity_type, title, body, user_id, is_demo) values
    ('client', v_client_barao, 'note', 'Cliente satisfeito com o primeiro trimestre', 'Síndico elogiou a clareza do RIA entregue.', v_user, true),
    ('opportunity', v_opp1, 'note', 'Aguardando retorno da assembleia', 'Decisão será tomada na próxima assembleia de condôminos.', v_user, true);
end $$;
