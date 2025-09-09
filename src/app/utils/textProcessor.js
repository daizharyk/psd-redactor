// utils/textProcessor.js

export function processText(text) {
  if (!text) return "";

  let result = text;

  result = result.replace(/fracttionb/g, "fraction");
  result = result.replace(/\(10U\(s10h3T/g, "");
  result = result.replace(/\(10U\(s16\.66h0T/g, "");
  result = result.replace(/Diepte/gi, "Depth"); // заменить hello на привет
  result = result.replace(/Zandfractie/gi, "Sand fraction"); // заменить hello на привет
  result = result.replace(/Fijnheidsgetal/gi, "Fineness"); // заменить hello на привет
  result = result.replace(/Grammes/gi, "Grams"); // заменить hello на привет
  result = result.replace(/Ucijfer {7}/gi, "U number");

  result = result.replace(
    /(^|\s)[\u0000-\u001F\u007F-\u009F\u00A0\uFEFF\uFFFD]*m[\u0000-\u001F\u007F-\u009F\u00A0\uFEFF\uFFFD]*(?=\s|$)/g,
    (match, leadingWhitespace, offset, fullString) => {
      // начало текущей строки
      const lineStart = fullString.lastIndexOf("\n", offset - 1) + 1;
      const before = fullString.slice(lineStart, offset);

      // если на той же строке перед этим 'm' встречается "Depth(", пропускаем замену
      if (/Depth\s*\(/i.test(before)) {
        return match; // возвращаем исходный фрагмент (ничего не меняем)
      }

      // иначе возвращаем сохранённый ведущий пробел + "mm" (удаляем любые битые символы вокруг m)
      return leadingWhitespace + "mm";
    }
  );

  result = result.replace(
    /(^|\n)([^\n]*?)\bCc\b/g,
    (match, lineStart, before) => {
      // убираем пробелы в конце части перед Cc
      const trimmed = before.trimEnd();

      // если trimmed заканчивается на букву/цифру (например, "mm", "M", "Dm") → пропускаем
      if (/[A-Za-zА-Яа-я0-9]$/.test(trimmed)) {
        return match; // не меняем
      }

      // иначе — перед Cc только пробелы или ":" → добавляем 2 пробела
      return lineStart + before + "  Cc";
    }
  );

  result = result.replace(/(Project n:.*)/g, "\n\n\n$1");

  // удаляем пустые строки перед "Made By" и добавляем 3 пустые строки перед самим текстом
  result = result.replace(/(\s*\n)*\s*(Made By.*)/g, "\n\n\n\n\n\n\n$2");

  return result;
}
