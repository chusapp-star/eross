'use strict';
const byId = id => document.getElementById(id);
const contacts = [
  {name:'Ana Demo', branch:'Centro'}, {name:'Luis Demo', branch:'Norte'},
  {name:'Sofía Demo', branch:'Oeste'}, {name:'Diego Demo', branch:'Centro'}
];
const templates = [
  'Podemos ayudarte a reagendar tu examen visual.', 'Te ayudamos a elegir los lentes que mejor se ajustan a tus necesidades.',
  'Conocé nuestra nueva colección de aros y agendá una visita.'
];
const tabs = Array.from(document.querySelectorAll('[data-section]'));
let batches, threads, active, currentTab;

function navigate(section) {
  currentTab = section;
  for (const tab of tabs) {
    const selected = tab.dataset.section === section;
    tab.setAttribute('aria-pressed', String(selected));
    byId(tab.dataset.section).hidden = !selected;
  }
  if (section === 'inbox') renderInbox();
  if (section === 'reports') renderReports();
}

const selected = () => Array.from(byId('contacts').querySelectorAll('input:checked'), input => contacts[Number(input.value)]);
const campaignMessage = person => 'Hola, ' + person.name + '. ' + templates[byId('template').selectedIndex] +
  (byId('channel').value === 'WhatsApp' ? '\nBotón de WhatsApp: Agendar cita' : '\nRespondé a este correo para agendar tu cita.');

function showPreview() {
  const people = selected();
  byId('preview-text').textContent = people.length ? campaignMessage(people[0]) : 'Seleccioná al menos un contacto.';
  byId('preview-text').style.whiteSpace = 'pre-line';
  byId('preview').hidden = false;
}

function send() {
  const people = selected();
  if (!people.length) { byId('campaign-status').textContent = 'Seleccioná al menos un contacto.'; return; }
  const channel = byId('channel').value;
  batches.unshift({template:byId('template').value, channel, count:people.length});
  if (channel === 'WhatsApp') {
    const person = people[0];
    if (!threads.has(person.name)) threads.set(person.name, []);
    threads.get(person.name).push(['EROSS', campaignMessage(person)], ['Cliente', 'Agendar cita']);
    active = person.name;
  }
  byId('campaign-status').textContent = people.length + ' envíos simulados.' +
    (channel === 'WhatsApp' ? ' Abrí la bandeja para ver una respuesta de ejemplo.' : ' Consultá el historial en Reportes.');
}

function renderInbox() {
  const list = byId('threads');
  list.replaceChildren();
  for (const name of threads.keys()) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = name;
    button.setAttribute('aria-pressed', String(name === active));
    button.onclick = () => { active = name; renderInbox(); };
    list.append(button);
  }
  byId('thread-title').textContent = active;
  const messages = byId('messages');
  messages.replaceChildren();
  for (const [sender, body] of threads.get(active)) {
    const item = document.createElement('li');
    item.textContent = sender + ' · ' + body;
    messages.append(item);
  }
}

function renderReports() {
  const metrics = byId('metrics');
  metrics.replaceChildren();
  const replies = Array.from(threads.values()).flat().filter(([sender]) => sender === 'Cliente').length;
  for (const [label, value] of [['Lotes simulados', batches.length],
    ['Envíos simulados', batches.reduce((sum, batch) => sum + batch.count, 0)], ['Respuestas simuladas', replies]]) {
    const card = document.createElement('div');
    card.className = 'card';
    const number = document.createElement('strong');
    number.className = 'metric';
    number.textContent = value;
    const caption = document.createElement('span');
    caption.className = 'metric-label';
    caption.textContent = label;
    card.append(number, caption);
    metrics.append(card);
  }
  const history = byId('history');
  history.replaceChildren();
  for (const batch of batches) {
    const row = history.insertRow();
    for (const value of [batch.template, batch.channel, batch.count]) row.insertCell().textContent = value;
  }
}

function reset() {
  batches = [{template:'Asesoría visual', channel:'WhatsApp', count:3}];
  threads = new Map([['Ana Demo', [['Cliente', 'Hola, quiero conocer los horarios disponibles.']]]]);
  active = 'Ana Demo';
  byId('channel').selectedIndex = 0;
  byId('template').selectedIndex = 0;
  byId('preview').hidden = true;
  byId('campaign-status').textContent = '';
  byId('reply-text').value = '';
  for (const input of byId('contacts').querySelectorAll('input')) input.checked = true;
  navigate('campaigns');
}

contacts.forEach((contact, index) => {
  const row = byId('contacts').insertRow();
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.value = index;
  input.setAttribute('aria-label', 'Incluir a ' + contact.name);
  row.insertCell().append(input);
  row.insertCell().textContent = contact.name;
  row.insertCell().textContent = contact.branch;
});
for (const tab of tabs) tab.onclick = () => navigate(tab.dataset.section);
byId('show-preview').onclick = showPreview;
byId('send').onclick = send;
byId('reset').onclick = reset;
byId('reply').onsubmit = event => {
  event.preventDefault();
  const input = byId('reply-text');
  const message = input.value.trim();
  if (!message || currentTab !== 'inbox') return;
  threads.get(active).push(['Equipo', message]);
  input.value = '';
  renderInbox();
};
reset();
