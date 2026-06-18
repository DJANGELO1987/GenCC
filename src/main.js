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
