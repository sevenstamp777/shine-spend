const XLSX = require('xlsx');
const db = require('../database');

const SHEET = '/home/erick/Documentos/PlanilhaFinanceiraProFinal_Corrigida.xlsx';
const TARGET_EMAIL = 'erick.unasp@gmail.com';

const DEFAULT_PAYMENT_METHODS = [
  'Pix',
  'Pix no Crédito',
  'Dinheiro',
  'Cartão Nubank',
  'Cartão Inter',
  'Cartão C6',
  'Cartão Bradesco',
  'Cartão Itaú',
];

function xl2iso(serial) {
  const ms = Math.round((Number(serial) - 25569) * 86400 * 1000);
  return new Date(ms).toISOString().slice(0, 10);
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function baseForm(form) {
  const f = String(form || '').trim();
  if (f === 'Pix') return 'Pix';
  if (f === 'Pix no Crédito') return 'Pix no Crédito';
  if (f === 'Dinheiro') return 'Dinheiro';
  if (f === 'Crédito') return 'Crédito';
  return '';
}

function mapPaymentMethod(form, card) {
  const f = String(form || '').trim();
  const c = String(card || '').trim();
  if (f === 'Pix') return 'Pix';
  if (f === 'Pix no Crédito') return 'Pix no Crédito';
  if (f === 'Dinheiro') return 'Dinheiro';
  if (f === 'Crédito') {
    if (['Nubank', 'Inter', 'C6', 'Bradesco', 'Itaú'].includes(c)) return 'Cartão ' + c;
    return 'Cartão';
  }
  return '';
}

async function main() {
  await db.init();

  const wb = XLSX.readFile(SHEET);
  const lancRows = XLSX.utils.sheet_to_json(wb.Sheets['📋 Lançamentos'], { header: 1 })
    .filter(r => r && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''));
  const itemRows = XLSX.utils.sheet_to_json(wb.Sheets['🛒 Itens'], { header: 1 })
    .filter(r => r && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''));
  const orcRows = XLSX.utils.sheet_to_json(wb.Sheets['🎯 Orçamento'], { header: 1 })
    .filter(r => r && r.some(c => c !== undefined && c !== null && String(c).trim() !== ''));

  const user = await db.get('SELECT id FROM users WHERE email = $1', [TARGET_EMAIL]);
  if (!user) throw new Error('Usuário não encontrado: ' + TARGET_EMAIL);
  const userId = user.id;

  await db.run('DELETE FROM transactions WHERE user_id = $1', [userId]);
  await db.run('DELETE FROM budgets WHERE user_id = $1', [userId]);
  await db.run('DELETE FROM payment_methods WHERE user_id = $1', [userId]);

  for (const name of DEFAULT_PAYMENT_METHODS) {
    await db.run(
      'INSERT INTO payment_methods (user_id, name) VALUES ($1, $2) ON CONFLICT (user_id, name) DO NOTHING',
      [userId, name]
    );
  }

  const txByKey = {};
  let txCount = 0;
  for (let i = 2; i < lancRows.length; i++) {
    const r = lancRows[i];
    const type = String(r[2] || '').trim() === 'Entrada' ? 'income' : 'expense';
    const descLocal = String(r[3] || '').trim();
    const category = String(r[4] || '').trim();
    const total = round2(r[8]);
    const date = xl2iso(r[1]);

    if (!descLocal || !category || !(total > 0) || !date) {
      console.log('SKIP lançamento inválido:', JSON.stringify(r));
      continue;
    }

    const pm = mapPaymentMethod(r[5], r[6]);
    const result = await db.run(
      `INSERT INTO transactions (user_id, type, description, amount, date, category, place, note, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
      [userId, type, descLocal, total, date, category, descLocal, '', pm]
    );
    const txId = result.rows[0].id;
    txCount++;

    const key = date + '|' + baseForm(r[5]);
    if (!txByKey[key]) txByKey[key] = [];
    txByKey[key].push({ txId, amount: total });
  }

  let itemCount = 0, itemLinked = 0, itemUnmatched = 0;
  for (let i = 2; i < itemRows.length; i++) {
    const r = itemRows[i];
    const produto = String(r[3] || '').trim();
    const categoria = String(r[9] || '').trim() || String(r[2] || '').trim();
    const qtd = Number(r[4]); const qty = !isNaN(qtd) && qtd > 0 ? qtd : 1;
    const unit = Number(r[5]); const unitPrice = !isNaN(unit) && unit >= 0 ? round2(unit) : 0;
    const desc = Number(r[6]); const discount = !isNaN(desc) && desc > 0 ? round2(desc) : 0;
    const total = Number(r[7]); const amount = !isNaN(total) && total > 0 ? round2(total) : round2(qty * unitPrice - discount);
    const date = r[8] !== undefined && r[8] !== null ? xl2iso(r[8]) : null;
    const form = baseForm(r[11]);

    if (!produto || !categoria || !(amount > 0)) {
      itemUnmatched++;
      continue;
    }
    itemCount++;

    let txId = null;
    if (date) {
      const key = date + '|' + form;
      const cands = txByKey[key];
      if (cands && cands.length) {
        let best = null, bestScore = Infinity;
        for (const c of cands) {
          const remaining = c.amount - (c.used || 0);
          const score = remaining >= amount ? Math.abs(remaining - amount) : Math.abs(remaining - amount) + 10000;
          if (score < bestScore) { bestScore = score; best = c; }
        }
        if (best) { txId = best.txId; best.used = (best.used || 0) + amount; }
      }
    }

    if (!txId) { itemUnmatched++; continue; }

    await db.run(
      `INSERT INTO transaction_items (transaction_id, description, category, amount, quantity, unit, unit_price, brand, discount)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [txId, produto, categoria, amount, qty, 'un', unitPrice, '', discount]
    );
    itemLinked++;
  }

  let budgetCount = 0;
  const seenCat = new Set();
  for (let i = 3; i < orcRows.length; i++) {
    const r = orcRows[i];
    const cat = String(r[0] || '').trim();
    const lim = Number(r[1]);
    if (!cat || cat === 'TOTAL' || cat === 'Receitas' || !(lim > 0) || seenCat.has(cat)) continue;
    seenCat.add(cat);
    await db.run(
      'INSERT INTO budgets (user_id, category, "limit") VALUES ($1, $2, $3) ON CONFLICT (user_id, category) DO UPDATE SET "limit" = EXCLUDED."limit"',
      [userId, cat, lim]
    );
    budgetCount++;
  }

  console.log('RESUMO:');
  console.log(' - lançamentos importados:', txCount);
  console.log(' - itens na planilha:', itemCount, '| vinculados:', itemLinked, '| sem vínculo:', itemUnmatched);
  console.log(' - orçamentos importados:', budgetCount);
  console.log(' - formas de pagamento:', DEFAULT_PAYMENT_METHODS.length);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
