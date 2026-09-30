# Protege Você

Landing page e checkout do **Protege Você** (seguro Riscos Diversos da Seguros Sura S/A, comercializado pelo Grupo FBN). Site estático em HTML/CSS/JS, sem build.

Domínio de produção: `https://portal.pingseguro.com.br` (compartilhado com o LDF, mas com GA4, pixel, cookies e webhook próprios).

## Estrutura

```
index.html                    Landing page (planos, coberturas, FAQ)
politica-de-privacidade.html  Política de Privacidade (LGPD)
checkout/
  index.html, script.js       Checkout em 3 etapas (dados, endereço, pagamento)
  obrigado.html               Contratação registrada
  erro.html                   Pagamento não aprovado
popup/
  pv-global.js                Atribuição (UTMs, partner_id) e dataLayer
  cookie-banner.js/.css       Consentimento de cookies (LGPD)
  tracking.js                 GA4 + Meta Pixel + eventos
  popup.js/.css               Pop-up de saída (captura de lead)
assets/                       Imagens e logos
```

## Rastreamento

Tudo é isolado do LDF: prefixo `pv`, cookie `pv_cookie_consent`, chaves `pv_*` no storage e o parâmetro `product: protege_voce` em todo evento.

- **GA4:** propriedade "Protege Você" (`G-ZCC1RMGQSM`)
- **Meta Pixel:** "Protege Você - Site" (`1475604171156644`)
- **Webhook do pop-up:** `https://n8n.grupofbn.com.br/webhook/popup-protege` (n8n grava o lead numa planilha)
- A configuração fica no bloco `window.PV_POPUP_CONFIG` do fim de `index.html`, `checkout/*.html` e `politica-de-privacidade.html`.
- GA4 e Meta Pixel **só carregam depois do aceite de cookies**. O banner tem "Aceitar" e "Preferências"; a recusa é feita em Preferências (toggles desmarcados por padrão).

### Eventos

| Onde | Evento GA4 / dataLayer | Evento Meta |
|---|---|---|
| Todas | `page_view` (GA4) | `PageView` |
| Landing, clique em plano | `select_plan` | `AddToCart` |
| Qualquer link `wa.me` | `whatsapp_click` | `Contact` |
| Checkout, abertura | `begin_checkout` | `InitiateCheckout` |
| Checkout, cada etapa | `checkout_step` | |
| Checkout, envio do pagamento | `add_payment_info` | `AddPaymentInfo` |
| `obrigado.html` | `purchase` (`transaction_id` = proposta) | `Purchase` |
| `erro.html` | `payment_error` | |
| Pop-up de saída | `popup_view`, `popup_close`, `popup_submit`, `lead_saved`, `popup_error` | `ViewContent`, `Lead`, `CompleteRegistration` |
| Banner de cookies | `cookie_banner_view`, `cookie_accept`, `cookie_reject`, `consent_update` | |

UTMs e `partner_id` (ou `pid`) da URL são guardados em `localStorage` e enviados junto com os eventos e com o lead.

## Pendências para produção (para o desenvolvedor)

1. **Pagamento é simulado.** Em `checkout/script.js` (`btn-submit`) o resultado é sorteado (70% sucesso) e o número da proposta é aleatório (`PV 123456`). Nenhum dado é enviado a gateway. É preciso integrar o gateway (o checkout exibe o logo da Iugu) e só então mandar o cliente para `obrigado.html`.
2. **Evento `purchase`:** hoje dispara com a simulação. Só deve disparar após a confirmação real do pagamento, com o ID real da transação.
3. **Checkout guarda dados pessoais** (CPF, e-mail, endereço) em `localStorage` (`protege-checkout`). Número do cartão é mascarado e o CVV é descartado, mas convém revisar.
4. **Caminho do site:** o Protege Você divide o domínio com o LDF. Definir se fica em subcaminho ou subdomínio e ajustar `canonical`, `og:url`, `sitemap.xml`, `robots.txt` e o fluxo de dados do GA4.
5. **Meta Pixel:** concluir a conexão do conjunto de dados à conta de anúncios "Grupo FBN" (exige autenticação em duas etapas).
6. **Política de Privacidade:** o texto precisa de revisão jurídica. O contato hoje é o WhatsApp `(11) 94716-4230`; incluir um e-mail de privacidade, se houver.
7. `fix.js`, `script.js` e `style.css` na raiz são resíduos (o `fix.js` é um patch de textos já aplicado; os outros dois estão vazios) e podem ser removidos.

## Rodar localmente

```bash
python -m http.server 8000
# abrir http://localhost:8000
```

Ao testar com o aceite de cookies, os eventos são enviados de verdade ao GA4 e ao Meta Pixel de produção.
