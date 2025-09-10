// utils/textProcessor.js

export function processText(text) {
  if (!text) return "";

  let result = text;

  // Ищем "Project n: C-" и за ним любое число, заменяем на "Project n: CMG-" + число
  result = result.replace(/(Project n:\s*)C-(\d+)/gi, "$1CMG-$2");

  result = result.replace(/Waarde Cu gextrapoleerd/g, "");
  result = result.replace(/fracttionb/g, "fraction");
  result = result.replace(/\(10U\(s10h3T/g, "");
  result = result.replace(/\(10U\(s16\.66h0T/g, "");
  result = result.replace(/\(10U\(s0p10h4099T&l6D/g, "");
  result = result.replace(/\(10U\(s0p17h4099T&l12D/g, "");
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

  // убираем ведущие пробелы и невидимые символы у строк, начинающихся с M2000, M63, Dm
  result = result
    .split("\n")
    .map((line) => {
      const cleanLine = line.replace(
        /[\u0000-\u001F\u007F-\u009F\u00A0\uFEFF\u200B]+/g,
        ""
      ); // убираем битые символы
      if (/^(M2000|M63|Dm)\s*:/.test(cleanLine)) {
        return cleanLine; // прижимаем к левому краю
      }
      return line; // остальные строки оставляем как есть
    })
    .join("\n");

  // удаляем пустые строки перед "Made By" и добавляем 3 пустые строки перед самим текстом
  result = result.replace(/(\s*\n)*\s*(Made By.*)/g, "\n\n\n\n\n\n\n$2");

  return result;
}
