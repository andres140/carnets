const apiBase = '/api/carnets';

async function loadCarnets() {
  const res = await fetch(apiBase);
  const data = await res.json();
  const tbody = document.getElementById('tablaCarnets');
  tbody.innerHTML = '';
  if (!Array.isArray(data.items)) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center">No hay carnés disponibles</td></tr>';
    return;
  }
  data.items.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.codigo}</td>
      <td>${item.usuario}</td>
      <td>${item.estado}</td>
      <td>${item.fecha_expedicion || ''}</td>
      <td>${item.fecha_vencimiento || ''}</td>
      <td>
        <button class="btn btn-sm btn-outline-success me-2" onclick="renovar('${item.codigo}')">Renovar</button>
        <button class="btn btn-sm btn-outline-warning me-2" onclick="suspender('${item.codigo}')">Suspender</button>
        <button class="btn btn-sm btn-outline-danger" onclick="revocar('${item.codigo}')">Revocar</button>
      </td>`;
    tbody.appendChild(tr);
  });
}

window.renovar = async (codigo) => {
  await fetch(`${apiBase}/${codigo}/renovar`, { method: 'PATCH' });
  loadCarnets();
};
window.suspender = async (codigo) => {
  await fetch(`${apiBase}/${codigo}/suspender`, { method: 'PATCH' });
  loadCarnets();
};
window.revocar = async (codigo) => {
  await fetch(`${apiBase}/${codigo}/revocar`, { method: 'PATCH' });
  loadCarnets();
};

document.getElementById('carnetForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  await fetch(apiBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: document.getElementById('usuario').value, observacion: document.getElementById('observacion').value })
  });
  document.getElementById('carnetForm').reset();
  loadCarnets();
});

document.getElementById('refreshBtn').addEventListener('click', loadCarnets);
loadCarnets();
