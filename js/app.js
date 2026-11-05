/**
 * Nosso Grande Dia — protótipo front-end v1.
 * IMPORTANTE: reserva e confirmação somente neste navegador (localStorage).
 * Não existe cobrança real, Pix, integração bancaria ou bloqueio entre dispositivos.
 * A versão de produção terá API com transações de banco e confirmação por webhook.
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'nosso-grande-dia-demo-v1';
  const RESERVATION_MS = 15 * 60 * 1000;
  const GIFT_ITEMS = [
    { id:'geladeira', name:'Geladeira', category:'Cozinha', value:300000, quotas:12, initial:8, emoji:'🧊', image:'assets/illustrations/geladeira.svg', description:'Para manter nossa cozinha sempre cheia de coisas boas!' },
    { id:'lavadora', name:'Máquina de lavar', category:'Lavanderia', value:240000, quotas:12, initial:5, emoji:'🫧', image:'assets/illustrations/lavadora.svg', description:'Para deixar a vida a dois mais prática e leve.' },
    { id:'sofa', name:'Sofá', category:'Sala', value:180000, quotas:9, initial:7, emoji:'🛋️', image:'assets/illustrations/sofa.svg', description:'Nosso cantinho para descansar e ver filmes juntinhos.' },
    { id:'microondas', name:'Micro-ondas', category:'Cozinha', value:60000, quotas:3, initial:1, emoji:'🍿', image:'assets/illustrations/microondas.svg', description:'Para os lanchinhos e os dias corridos.' },
    { id:'fogao', name:'Fogão', category:'Cozinha', value:200000, quotas:10, initial:3, emoji:'🍲', image:'assets/illustrations/fogao.svg', description:'Para preparar nossas primeiras receitas em casa.' },
    { id:'cama', name:'Cama de casal', category:'Quarto', value:180000, quotas:9, initial:2, emoji:'🛏️', image:'assets/illustrations/cama.svg', description:'Para descansar depois de um dia cheio de amor.' },
    { id:'cafeteira', name:'Cafeteira', category:'Cozinha', value:40000, quotas:4, initial:0, emoji:'☕', image:'assets/illustrations/cafeteira.svg', description:'Para começar as manhãs com aroma de café.' },
    { id:'mesa', name:'Mesa de jantar', category:'Sala', value:160000, quotas:8, initial:0, emoji:'🌼', image:'assets/illustrations/mesa.svg', description:'Onde vamos receber a família e os amigos.' }
  ];
  const fmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits:0 });
  const $ = id => document.getElementById(id);
  const grid = $('giftsGrid');
  const filters = $('filters');
  const modal = $('giftDialog');
  const content = $('dialogContent');
  const toast = $('toast');
  let activeFilter = 'Todos';
  let state = loadState();
  let selectedId = null;
  let selectedQty = 1;
  let toastTimer;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (typeof raw !== 'object' || !raw || Array.isArray(raw)) throw Error('invalid');
      return { confirmations: typeof raw.confirmations === 'object' && raw.confirmations ? raw.confirmations : {}, reservations: Array.isArray(raw.reservations) ? raw.reservations : [] };
    } catch { return { confirmations: {}, reservations: [] }; }
  }
  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { notify('Seu navegador não permitiu salvar os dados da simulação.'); }
  }
  function cleanup() {
    const now = Date.now();
    const prior = state.reservations.length;
    state.reservations = state.reservations.filter(r => r && Number.isFinite(r.expiresAt) && r.expiresAt > now && GIFT_ITEMS.some(g => g.id === r.giftId));
    if (state.reservations.length !== prior) saveState();
  }
  function qtyConfirmed(item) {
    const val = Number(state.confirmations[item.id] || 0);
    return Math.max(0, Math.min(item.quotas - item.initial, Number.isFinite(val) ? Math.floor(val) : 0));
  }
  function qtyReserved(item) {
    return state.reservations.filter(r=>r.giftId===item.id).reduce((sum,r)=>sum+Math.max(0,Math.floor(Number(r.qty)||0)),0);
  }
  function qtyAvailable(item) {
    return Math.max(0,item.quotas-item.initial-qtyConfirmed(item)-qtyReserved(item));
  }
  function renderFilters() {
    const categories=['Todos',...new Set(GIFT_ITEMS.map(g=>g.category))];
    filters.replaceChildren(...categories.map(category=>{
      const button=document.createElement('button');button.type='button';button.textContent=category;
      button.className=`filter-pill${category===activeFilter?' active':''}`;
      button.setAttribute('aria-pressed',String(category===activeFilter));
      button.addEventListener('click',()=>{activeFilter=category;renderFilters();renderGifts();});
      return button;
    }));
  }
  function renderGifts() {
    cleanup();
    grid.innerHTML=GIFT_ITEMS.filter(g=>activeFilter==='Todos'||g.category===activeFilter).map(item=>{
      const gifted=item.initial+qtyConfirmed(item);
      const remaining=qtyAvailable(item);
      const progress=Math.round((gifted/item.quotas)*100);
      const piece=item.value/item.quotas;
      return `<article class="gift-card">
        <div class="gift-icon-wrap"><img src="${item.image}" alt="Ilustração de ${item.name.toLowerCase()}" loading="lazy"></div>
        <span class="gift-category">${item.category}</span>
        <h3 class="gift-name">${item.name}</h3>
        <span class="quota-chip">${fmt.format(piece/100)} por cota</span>
        <div class="gift-value">Valor total <b>${fmt.format(item.value/100)}</b></div>
        <div class="progress-track" role="progressbar" aria-label="${item.name}: cotas presenteadas" aria-valuemin="0" aria-valuemax="${item.quotas}" aria-valuenow="${gifted}"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="gift-count">${remaining} de ${item.quotas} cotas disponíveis</p>
        <button type="button" class="gift-button" data-gift="${item.id}" ${remaining===0?'disabled':''}>${remaining===0?'Sem cotas disponíveis':'Contribuir'}</button>
      </article>`;
    }).join('');
    grid.querySelectorAll('[data-gift]').forEach(button=>button.addEventListener('click',()=>openGift(button.dataset.gift)));
  }
  function notify(message) {
    toast.textContent=message; toast.classList.add('show');clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>toast.classList.remove('show'),3700);
  }
  function showDialog() {
    if (typeof modal.showModal === 'function' && !modal.open) modal.showModal();
  }
  function closeDialog() {
    if (modal.open) modal.close();selectedId=null;
  }
  function openGift(id) {
    cleanup();
    const item=GIFT_ITEMS.find(g=>g.id===id);
    if (!item || !qtyAvailable(item)) {notify('Todas as cotas desse presente estão indisponíveis.');renderGifts();return;}
    selectedId=id; selectedQty=1;
    renderGiftDetail();showDialog();
  }
  function renderGiftDetail() {
    const item=GIFT_ITEMS.find(g=>g.id===selectedId);if(!item)return;
    const available=qtyAvailable(item);
    if(available===0){content.innerHTML='<div class="success-symbol">💌</div><h2 class="success-title">As cotas foram escolhidas</h2><p class="success-text">Escolha outro presente para participar.</p>';return;}
    selectedQty=Math.max(1,Math.min(selectedQty,available));
    content.innerHTML=`
      <div class="dialog-overline">UM PRESENTE CHEIO DE CARINHO</div>
      <img class="dialog-icon" src="${item.image}" alt="${item.name}">
      <h2 id="dialogTitle" class="dialog-title">${item.name} ${item.emoji}</h2>
      <p class="dialog-description">${item.description}</p>
      <div class="dialog-stats"><span>${available} cotas disponíveis</span><span>Cota: <strong>${fmt.format(item.value/item.quotas/100)}</strong></span></div>
      <div class="quantity-picker"><button type="button" id="qtyMinus" aria-label="Diminuir quantidade">−</button><strong id="qtyNum" aria-live="polite">${selectedQty}</strong><button type="button" id="qtyPlus" aria-label="Aumentar quantidade">+</button></div>
      <div class="sum-box"><span>Total simbólico</span><strong id="qtyTotal">${fmt.format(item.value/item.quotas*selectedQty/100)}</strong></div>
      <label class="input-label" for="guestName">Seu nome (para esta demonstração)</label>
      <input class="guest-input" id="guestName" type="text" maxlength="60" placeholder="Como podemos te chamar?" autocomplete="name">
      <button class="dialog-primary" id="reserveGift" type="button">Reservar ${selectedQty} cota${selectedQty>1?'s':''} por 15 minutos ♡</button>
      <p class="dialog-small">Nesta etapa você apenas simula a reserva. Não há cobrança ou Pix real.</p>`;
    function updateQuantity(next){selectedQty=Math.min(available,Math.max(1,next));$('qtyNum').textContent=selectedQty;$('qtyTotal').textContent=fmt.format(item.value/item.quotas*selectedQty/100);$('reserveGift').textContent=`Reservar ${selectedQty} cota${selectedQty>1?'s':''} por 15 minutos ♡`;}
    $('qtyMinus').addEventListener('click',()=>updateQuantity(selectedQty-1));
    $('qtyPlus').addEventListener('click',()=>updateQuantity(selectedQty+1));
    $('reserveGift').addEventListener('click',()=>reserveGift(item));
  }
  function reserveGift(item) {
    cleanup();const available=qtyAvailable(item);
    if(selectedQty>available){notify('O número de cotas disponíveis mudou.');renderGiftDetail();renderGifts();return;}
    const name=$('guestName').value.trim();
    if(name.length<2){$('guestName').focus();notify('Digite um nome com pelo menos 2 caracteres.');return;}
    const id=typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`demo-${Date.now()}-${Math.round(Math.random()*1000000)}`;
    state.reservations.push({id, giftId:item.id, qty:selectedQty, name:name.slice(0,60), expiresAt:Date.now()+RESERVATION_MS});
    saveState(); renderGifts();renderReservation(id);
  }
  function renderReservation(id){
    cleanup();const r=state.reservations.find(x=>x.id===id);if(!r){content.innerHTML='<div class="success-symbol">⌛</div><h2 id="dialogTitle" class="success-title">Reserva expirada</h2><p class="success-text">O prazo terminou. Você pode escolher novamente um presente.</p>';renderGifts();return;}
    const item=GIFT_ITEMS.find(g=>g.id===r.giftId);
    const total=fmt.format(item.value/item.quotas*r.qty/100);
    content.innerHTML=`<span class="success-symbol" aria-hidden="true">💌</span><div class="dialog-overline">RESERVA DE DEMONSTRAÇÃO</div><h2 id="dialogTitle" class="success-title">Seu carinho está reservado!</h2><p class="success-text">${r.qty} cota${r.qty>1?'s':''} de <strong>${item.name}</strong> · ${total}<br>Reserva exclusiva neste navegador, por até 15 minutos.</p><div class="countdown" id="reservationCountdown" aria-live="off"></div><div class="demo-warning">🧪 <strong>Modo demonstração:</strong> esta tela não gera QR Code Pix e não recebe dinheiro. A confirmação abaixo é apenas simulada.</div><button class="dialog-primary" id="simulatePayment" type="button">Simular confirmação de presente</button><button class="dialog-secondary" id="cancelReservation" type="button">Liberar minhas cotas</button>`;
    $('simulatePayment').addEventListener('click',()=>confirmReservation(r.id));
    $('cancelReservation').addEventListener('click',()=>cancelReservation(r.id));
    renderCountdown(r.expiresAt);
  }
  function renderCountdown(expiresAt){
    const el=$('reservationCountdown');if(!el)return;
    const seconds=Math.max(0,Math.ceil((expiresAt-Date.now())/1000));
    el.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }
  function confirmReservation(id){
    cleanup();const reservation=state.reservations.find(r=>r.id===id);
    if(!reservation){renderReservation(id);notify('A reserva expirou.');return;}
    const item=GIFT_ITEMS.find(g=>g.id===reservation.giftId);
    state.confirmations[item.id]=qtyConfirmed(item)+reservation.qty;
    state.reservations=state.reservations.filter(r=>r.id!==id);
    saveState();renderGifts();
    content.innerHTML=`<span class="success-symbol" aria-hidden="true">🎉</span><h2 id="dialogTitle" class="success-title">Presente registrado!</h2><p class="success-text">Nesta simulação, ${reservation.qty} cota${reservation.qty>1?'s foram registradas':' foi registrada'} como escolhida${reservation.qty>1?'s':''}.<br><strong>Nenhum pagamento real foi realizado.</strong></p><button class="dialog-primary" id="finishReservation" type="button">Continuar vendo os presentes ♡</button>`;
    $('finishReservation').addEventListener('click',closeDialog);
    notify('Cotas atualizadas nesta demonstração!');
  }
  function cancelReservation(id){state.reservations=state.reservations.filter(r=>r.id!==id);saveState();closeDialog();renderGifts();notify('Cotas liberadas novamente.');}
  function tick(){
    const before=state.reservations.length;cleanup();
    if(before!==state.reservations.length) renderGifts();
    if(modal.open && $('reservationCountdown')) {
      const all=state.reservations;
      const reservation=all.find(r=>r.giftId===selectedId);
      if(reservation)renderCountdown(reservation.expiresAt);
      else if(before!==all.length){content.innerHTML='<span class="success-symbol">⌛</span><h2 id="dialogTitle" class="success-title">Tempo esgotado</h2><p class="success-text">As cotas voltaram a ficar disponíveis.</p>';}
    }
  }
  $('closeDialog').addEventListener('click',closeDialog);
  modal.addEventListener('click',e=>{if(e.target===modal)closeDialog();});
  $('menuToggle').addEventListener('click',()=>{const open=$('siteNav').classList.toggle('open');$('menuToggle').setAttribute('aria-expanded',String(open));});
  document.querySelectorAll('.site-nav a').forEach(a=>a.addEventListener('click',()=>{$('siteNav').classList.remove('open');$('menuToggle').setAttribute('aria-expanded','false');}));
  $('resetDemo').addEventListener('click',()=>{if(!confirm('Reiniciar todos os presentes e reservas desta demonstração?'))return;state={confirmations:{},reservations:[]};saveState();closeDialog();renderGifts();notify('Simulação reiniciada.');});
  renderFilters();renderGifts();setInterval(tick,1000);
})();
