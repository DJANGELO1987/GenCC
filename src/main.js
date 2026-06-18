// src/main.js
document.addEventListener('DOMContentLoaded', () => {
  const inputCard = document.querySelector('.input_card');
  const chkbxDate = document.querySelector('.chkbxDateCard');
  const ascCheckbox = document.querySelector('.asc');
  const selectMonth = document.querySelector('.selectMonth');
  const selectYear = document.querySelector('.selectYear');
  const chkbxCode = document.querySelector('.chkbxCodeCard');
  const inputCode = document.querySelector('.inputCode');
  const quantityInput = document.querySelector('.quantityCards');
  const btnGenerate = document.querySelector('.generate_cards');
  const btnCopy = document.querySelector('.copy_btn');
  const output = document.querySelector('.generated_cards');
  const status = document.querySelector('.status');

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function luhnVerify(number) {
    let sum = 0;
    const str = String(number);
    for (let i = 0; i < str.length; i++) {
      let digit = parseInt(str[str.length - 1 - i], 10);
      if (i % 2 === 1) digit *= 2;
      if (digit > 9) digit -= 9;
      sum += digit;
    }
    return sum % 10 === 0;
  }

  function luhnCheckDigit(prefix) {
    for (let d = 0; d <= 9; d++) {
      if (luhnVerify(prefix + d)) return String(d);
    }
    return '0';
  }

  function generateCardNumber(prefix = '', length = 16) {
    prefix = String(prefix).replace(/\s+/g, '');
    let base = prefix.slice(0, length - 1);
    while (base.length < length - 1) base += String(randomInt(0, 9));
    const check = luhnCheckDigit(base);
    return base + check;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function addMonths(month, year, offset) {
    const total = (Number(year) * 12 + Number(month) - 1) + offset;
    const newYear = Math.floor(total / 12);
    const newMonth = (total % 12) + 1;
    return { month: pad2(newMonth), year: String(newYear) };
  }

  btnGenerate.addEventListener('click', () => {
    const prefix = inputCard.value.trim();
    const includeDate = chkbxDate.checked;
    const asc = ascCheckbox.checked;
    const includeCvv = chkbxCode.checked;
    const codeValue = inputCode.value.trim();
    let qty = parseInt(quantityInput.value, 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      status.textContent = 'Cantidad inválida, usando 5 por defecto.';
      qty = 5;
    }
    if (qty > 500) {
      status.textContent = 'Máx 500 — ajustando a 500.';
      qty = 500;
    }

    // small UX: disable buttons while generating
    btnGenerate.disabled = true;
    btnCopy.disabled = true;
    status.textContent = 'Generando...';

    const monthOption = selectMonth.value;
    const yearOption = selectYear.value;

    const results = [];

    for (let i = 0; i < qty; i++) {
      const card = generateCardNumber(prefix, 16);

      let dateStr = '';
      if (includeDate) {
        let mm, yy;
        if (monthOption === 'Random' || yearOption === 'Random') {
          // random month/year independently
          const randMonth = monthOption === 'Random' ? pad2(randomInt(1, 12)) : monthOption;
          const randYear = yearOption === 'Random' ? String(randomInt(2026, 2035)) : yearOption;
          mm = randMonth; yy = randYear;
        } else {
          // both specified or fixed; if ASC, increment
          if (asc) {
            const dt = addMonths(monthOption, yearOption, i);
            mm = dt.month; yy = dt.year;
          } else {
            mm = monthOption; yy = yearOption;
          }
        }
        // format yy as two digits
        dateStr = `${mm}/${String(yy).slice(-2)}`;
      }

      let cvv = '';
      if (includeCvv) {
        if (!codeValue || codeValue.toLowerCase() === 'random') {
          cvv = String(randomInt(0, 999)).padStart(3, '0');
        } else {
          cvv = codeValue;
        }
      }

      // final format: CARD | MM/YY | CVV (omit parts if disabled)
      const parts = [card];
      if (dateStr) parts.push(dateStr);
      if (cvv) parts.push(cvv);
      results.push(parts.join(' | '));
    }

    output.value = results.join('\n');
    output.scrollTop = 0;
    status.textContent = `Generadas ${results.length} tarjetas.`;
    btnGenerate.disabled = false;
    btnCopy.disabled = false;
  });

  btnCopy.addEventListener('click', async () => {
    try {
      const text = output.value;
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // fallback
        output.select();
        document.execCommand('copy');
        window.getSelection()?.removeAllRanges();
      }
      const original = btnCopy.textContent;
      btnCopy.textContent = '✅ Copiado';
      status.textContent = 'Resultados copiados al portapapeles.';
      setTimeout(() => { btnCopy.textContent = original; status.textContent = ''; }, 1400);
    } catch (e) {
      console.error('Copy failed', e);
      status.textContent = 'No se pudo copiar automáticamente. Selecciona y copia manualmente.';
    }
  });
});
"use strict";

const inputCardEl = document.querySelector('.input_card');
const quantityEl = document.querySelector('.quantityCards');
const ascCheckboxEl = document.querySelector('.asc');
const generatedCardsEl = document.querySelector('.generated_cards');
const copyBtnEl = document.querySelector('.copy_btn');
const generateBtnEl = document.querySelector('.generate_cards');
const selectMonthEl = document.querySelector('.selectMonth');
const selectYearEl = document.querySelector('.selectYear');
const checkboxDateEl = document.querySelector('.chkbxDateCard');
const chkbxCodeCardEl = document.querySelector('.chkbxCodeCard');
const inputCodeEl = document.querySelector('.inputCode');

function digitsOf(n) {
  return n.split('').map(Number);
}

function sumArr(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function luhnChecksum(card) {
  const digits = digitsOf(card);
  const oddDigits = [];
  const evenDigits = [];

  for (let i = 0; i < digits.length; i++) {
    if ((digits.length - i) % 2 === 0) {
      evenDigits.push(digits[i]);
    } else {
      oddDigits.push(digits[i]);
    }
  }

  let checksum = sumArr(oddDigits);

  evenDigits.forEach(digit => {
    let double = digit * 2;
    if (double > 9) {
      double -= 9;
    }
    checksum += double;
  });

  return checksum % 10;
}

function isLuhnValid(card) {
  return luhnChecksum(card) === 0;
}

function ranRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function hasInvalidPattern(value) {
  return /[^0-9x]/i.test(value);
}

function getPatternCount(card) {
  return [...card].filter(char => char === 'x').length;
}

function formatDateSuffix() {
  if (!checkboxDateEl.checked) {
    return '';
  }

  const month = selectMonthEl.value === 'Random'
    ? ranRange(1, 12).toString().padStart(2, '0')
    : selectMonthEl.value.padStart(2, '0');

  const year = selectYearEl.value === 'Random'
    ? ranRange(2026, 2035).toString()
    : selectYearEl.value;

  return `|${month}|${year}`;
}

function formatCodeSuffix() {
  if (!chkbxCodeCardEl.checked) {
    return '';
  }

  const code = inputCodeEl.value.trim();
  return code === '' ? `|${ranRange(100, 999).toString().padStart(3, '0')}` : `|${code}`;
}

function fillPattern(card, replacement) {
  let filled = card;
  for (const digit of replacement) {
    filled = filled.replace(/x/, digit);
  }
  return filled;
}

function randomCard(card) {
  const xCount = getPatternCount(card);
  if (xCount === 0) {
    return card;
  }

  const max = 10 ** xCount;
  let generated = '';

  while (generated.length === 0) {
    const replacement = ranRange(0, max - 1).toString().padStart(xCount, '0');
    const candidate = fillPattern(card, replacement);
    if (isLuhnValid(candidate)) {
      generated = candidate;
    }
  }

  return generated;
}

function randomCardQuantity(card, quantity) {
  let result = '';

  for (let i = 0; i < quantity; i++) {
    const dateSuffix = formatDateSuffix();
    const codeSuffix = formatCodeSuffix();
    result += `${randomCard(card)}${dateSuffix}${codeSuffix}\n`;
  }

  return result;
}

function ascCards(card) {
  const xCount = getPatternCount(card);
  if (xCount === 0 || xCount > 6) {
    return [];
  }

  const cards = [];
  const dateSuffix = formatDateSuffix();
  const max = 10 ** xCount;

  for (let i = 0; i < max; i++) {
    const replacement = i.toString().padStart(xCount, '0');
    const candidate = fillPattern(card, replacement);
    if (isLuhnValid(candidate)) {
      cards.push(`${candidate}${dateSuffix}`);
    }
  }

  return cards;
}

function showAlert(message) {
  alert(message);
}

function padCardInput() {
  const value = inputCardEl.value.trim().toLowerCase();
  if (value.length < 4 || hasInvalidPattern(value)) {
    return;
  }

  const targetLength = value.charAt(0) === '3' ? 15 : 16;
  if (value.length < targetLength) {
    inputCardEl.value = value.padEnd(targetLength, 'x');
  }
}

function generateCards() {
  const cardValue = inputCardEl.value.trim().toLowerCase();
  const quantity = Math.max(1, Math.min(100, parseInt(quantityEl.value, 10) || 1));

  if (cardValue.length === 0) {
    showAlert('Ingresa un patrón de tarjeta con al menos una "x".');
    return;
  }

  if (hasInvalidPattern(cardValue)) {
    showAlert('El número de tarjeta solo puede contener dígitos y "x".');
    return;
  }

  if (!cardValue.includes('x')) {
    showAlert('La tarjeta debe incluir al menos una "x" para generar números válidos.');
    return;
  }

  if (ascCheckboxEl.checked) {
    if (getPatternCount(cardValue) > 6) {
      showAlert('ASC soporta hasta 6 posiciones "x" para evitar listas muy grandes.');
      return;
    }

    const cards = ascCards(cardValue);
    if (cards.length === 0) {
      generatedCardsEl.value = '';
      showAlert('No se encontraron tarjetas válidas con ese patrón.');
      return;
    }

    generatedCardsEl.value = cards.join('\n');
    return;
  }

  generatedCardsEl.value = randomCardQuantity(cardValue, quantity);
}

function copyResults() {
  const text = generatedCardsEl.value.trim();
  if (!text) {
    showAlert('No hay resultados para copiar');
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    copyBtnEl.textContent = '✅ Copiado';
    setTimeout(() => {
      copyBtnEl.textContent = '📋 Copiar resultados';
    }, 2000);
  }).catch(() => {
    generatedCardsEl.select();
    document.execCommand('copy');
    showAlert('Resultados copiados');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (generateBtnEl) {
    generateBtnEl.addEventListener('click', generateCards);
  }

  if (copyBtnEl) {
    copyBtnEl.addEventListener('click', copyResults);
  }

  if (inputCardEl) {
    inputCardEl.addEventListener('blur', padCardInput);
  }
});
