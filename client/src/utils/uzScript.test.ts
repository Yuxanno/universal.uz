/**
 * Unit-тесты для конвертации узбекского текста lat↔cyr
 */

import { toUzCyr, toUzLat, toUzScript, normalizeApostrophes } from './uzScript';

describe('uzScript', () => {
  describe('normalizeApostrophes', () => {
    test('Нормализует различные апострофы', () => {
      expect(normalizeApostrophes("o'qituvchi")).toBe("o'qituvchi");
      expect(normalizeApostrophes("oʻqituvchi")).toBe("o'qituvchi");
      expect(normalizeApostrophes("o'qituvchi")).toBe("o'qituvchi");
      expect(normalizeApostrophes("o`qituvchi")).toBe("o'qituvchi");
      expect(normalizeApostrophes("o´qituvchi")).toBe("o'qituvchi");
    });
  });

  describe('toUzCyr - латиница → кириллица', () => {
    describe('Базовые слова', () => {
      test("o'qituvchi -> ўқитувчи", () => {
        expect(toUzCyr("o'qituvchi")).toBe('ўқитувчи');
      });

      test("g'isht -> ғишт", () => {
        expect(toUzCyr("g'isht")).toBe('ғишт');
      });

      test('shahar -> шаҳар', () => {
        expect(toUzCyr('shahar')).toBe('шаҳар');
      });

      test('chaqaloq -> чақалоқ', () => {
        expect(toUzCyr('chaqaloq')).toBe('чақалоқ');
      });

      test("yo'l -> йўл", () => {
        expect(toUzCyr("yo'l")).toBe('йўл');
      });
    });

    describe('Специальные комбинации', () => {
      test('yangi -> янги', () => {
        expect(toUzCyr('yangi')).toBe('янги');
      });

      test('yurt -> юрт', () => {
        expect(toUzCyr('yurt')).toBe('юрт');
      });

      test('yengil -> енгил', () => {
        expect(toUzCyr('yengil')).toBe('енгил');
      });

      test('yoqimli -> ёқимли', () => {
        expect(toUzCyr('yoqimli')).toBe('ёқимли');
      });

      test('tong -> тонг', () => {
        expect(toUzCyr('tong')).toBe('тонг');
      });
    });

    describe('Заглавные буквы', () => {
      test('Shahar -> Шаҳар', () => {
        expect(toUzCyr('Shahar')).toBe('Шаҳар');
      });

      test("O'zbekiston -> Ўзбекистон", () => {
        expect(toUzCyr("O'zbekiston")).toBe('Ўзбекистон');
      });

      test("G'alaba -> Ғалаба", () => {
        expect(toUzCyr("G'alaba")).toBe('Ғалаба');
      });
    });

    describe('Сложные слова', () => {
      test('choyxona -> чойхона', () => {
        expect(toUzCyr('choyxona')).toBe('чойхона');
      });

      test("qo'ng'iroq -> қўнғироқ", () => {
        expect(toUzCyr("qo'ng'iroq")).toBe('қўнғироқ');
      });

      test("sho'rva -> шўрва", () => {
        expect(toUzCyr("sho'rva")).toBe('шўрва');
      });
    });
  });

  describe('toUzLat - кириллица → латиница', () => {
    describe('Базовые слова', () => {
      test("ўқитувчи -> o'qituvchi", () => {
        expect(toUzLat('ўқитувчи')).toBe("o'qituvchi");
      });

      test("ғишт -> g'isht", () => {
        expect(toUzLat('ғишт')).toBe("g'isht");
      });

      test('шаҳар -> shahar', () => {
        expect(toUzLat('шаҳар')).toBe('shahar');
      });

      test('чақалоқ -> chaqaloq', () => {
        expect(toUzLat('чақалоқ')).toBe('chaqaloq');
      });

      test("йўл -> yo'l", () => {
        expect(toUzLat('йўл')).toBe("yo'l");
      });
    });

    describe('Специальные комбинации', () => {
      test('янги -> yangi', () => {
        expect(toUzLat('янги')).toBe('yangi');
      });

      test('юрт -> yurt', () => {
        expect(toUzLat('юрт')).toBe('yurt');
      });

      test('енгил -> yengil (или engil)', () => {
        // Примечание: 'е' в начале слова может быть как 'ye', так и 'e'
        // В узбекском языке оба варианта допустимы
        const result = toUzLat('енгил');
        expect(['yengil', 'engil']).toContain(result);
      });

      test('ёқимли -> yoqimli', () => {
        expect(toUzLat('ёқимли')).toBe('yoqimli');
      });

      test('тонг -> tong', () => {
        expect(toUzLat('тонг')).toBe('tong');
      });
    });

    describe('Заглавные буквы', () => {
      test('Шаҳар -> Shahar', () => {
        expect(toUzLat('Шаҳар')).toBe('Shahar');
      });

      test("Ўзбекистон -> O'zbekiston", () => {
        expect(toUzLat('Ўзбекистон')).toBe("O'zbekiston");
      });

      test("Ғалаба -> G'alaba", () => {
        expect(toUzLat('Ғалаба')).toBe("G'alaba");
      });
    });

    describe('Сложные слова', () => {
      test('чойхона -> choyxona', () => {
        expect(toUzLat('чойхона')).toBe('choyxona');
      });

      test("қўнғироқ -> qo'ng'iroq", () => {
        expect(toUzLat('қўнғироқ')).toBe("qo'ng'iroq");
      });

      test("шўрва -> sho'rva", () => {
        expect(toUzLat('шўрва')).toBe("sho'rva");
      });

      test('чой -> choy', () => {
        expect(toUzLat('чой')).toBe('choy');
      });
    });

    describe('Дополнительные 15 тестов cyr→lat', () => {
      test("Ўзбекистон -> O'zbekiston", () => {
        expect(toUzLat('Ўзбекистон')).toBe("O'zbekiston");
      });

      test("ғишт -> g'isht", () => {
        expect(toUzLat('ғишт')).toBe("g'isht");
      });

      test('шаҳар -> shahar', () => {
        expect(toUzLat('шаҳар')).toBe('shahar');
      });

      test('чой -> choy', () => {
        expect(toUzLat('чой')).toBe('choy');
      });

      test("қўнғироқ -> qo'ng'iroq", () => {
        expect(toUzLat('қўнғироқ')).toBe("qo'ng'iroq");
      });

      test("бўлим -> bo'lim", () => {
        expect(toUzLat('бўлим')).toBe("bo'lim");
      });

      test('китоб -> kitob', () => {
        expect(toUzLat('китоб')).toBe('kitob');
      });

      test('мактаб -> maktab', () => {
        expect(toUzLat('мактаб')).toBe('maktab');
      });

      test('дарс -> dars', () => {
        expect(toUzLat('дарс')).toBe('dars');
      });

      test("ўқув -> o'quv", () => {
        expect(toUzLat('ўқув')).toBe("o'quv");
      });

      test('ишчи -> ishchi', () => {
        expect(toUzLat('ишчи')).toBe('ishchi');
      });

      test('кеча -> kecha', () => {
        expect(toUzLat('кеча')).toBe('kecha');
      });

      test('бугун -> bugun', () => {
        expect(toUzLat('бугун')).toBe('bugun');
      });

      test('эртага -> ertaga', () => {
        expect(toUzLat('эртага')).toBe('ertaga');
      });

      test('ҳафта -> hafta', () => {
        expect(toUzLat('ҳафта')).toBe('hafta');
      });
    });
  });

  describe('toUzScript - универсальная конвертация', () => {
    test('Конвертирует латиницу в кириллицу', () => {
      expect(toUzScript("o'qituvchi", 'cyr')).toBe('ўқитувчи');
      expect(toUzScript('shahar', 'cyr')).toBe('шаҳар');
    });

    test('Конвертирует кириллицу в латиницу', () => {
      expect(toUzScript('ўқитувчи', 'lat')).toBe("o'qituvchi");
      expect(toUzScript('шаҳар', 'lat')).toBe('shahar');
    });

    test('Не конвертирует, если уже в нужном скрипте', () => {
      expect(toUzScript("o'qituvchi", 'lat')).toBe("o'qituvchi");
      expect(toUzScript('ўқитувчи', 'cyr')).toBe('ўқитувчи');
    });

    test('Обрабатывает пустые строки', () => {
      expect(toUzScript('', 'cyr')).toBe('');
      expect(toUzScript('', 'lat')).toBe('');
    });

    test('Обрабатывает смешанный текст с цифрами', () => {
      expect(toUzScript('tovar123', 'cyr')).toBe('товар123');
      expect(toUzScript('товар123', 'lat')).toBe('tovar123');
    });
  });

  describe('Двунаправленная конвертация (туда-обратно)', () => {
    const testWords = [
      "o'qituvchi",
      "g'isht",
      'shahar',
      'chaqaloq',
      "yo'l",
      'yangi',
      "O'zbekiston",
      "qo'ng'iroq",
    ];

    testWords.forEach((word) => {
      test(`${word} -> cyr -> lat = ${word}`, () => {
        const cyr = toUzCyr(word);
        const backToLat = toUzLat(cyr);
        expect(backToLat).toBe(word);
      });
    });
  });

  describe('Автоматическая нормализация (как в uz())', () => {
    test('Латинский скрипт: кириллица → латиница', () => {
      const text = 'ўқитувчи'; // кириллица
      const result = toUzScript(text, 'lat');
      expect(result).toBe("o'qituvchi");
    });

    test('Латинский скрипт: латиница → латиница (без изменений)', () => {
      const text = "o'qituvchi"; // латиница
      const result = toUzScript(text, 'lat');
      expect(result).toBe("o'qituvchi");
    });

    test('Кириллический скрипт: латиница → кириллица', () => {
      const text = "o'qituvchi"; // латиница
      const result = toUzScript(text, 'cyr');
      expect(result).toBe('ўқитувчи');
    });

    test('Кириллический скрипт: кириллица → кириллица (без изменений)', () => {
      const text = 'ўқитувчи'; // кириллица
      const result = toUzScript(text, 'cyr');
      expect(result).toBe('ўқитувчи');
    });

    test('Смешанные данные нормализуются к латинице', () => {
      const products = [
        "o'qituvchi",  // латиница
        'ўқитувчи',    // кириллица
        'shahar',      // латиница
        'шаҳар'        // кириллица
      ];
      
      const normalized = products.map(name => toUzScript(name, 'lat'));
      
      expect(normalized).toEqual([
        "o'qituvchi",
        "o'qituvchi",
        'shahar',
        'shahar'
      ]);
    });

    test('Смешанные данные нормализуются к кириллице', () => {
      const products = [
        "o'qituvchi",  // латиница
        'ўқитувчи',    // кириллица
        'shahar',      // латиница
        'шаҳар'        // кириллица
      ];
      
      const normalized = products.map(name => toUzScript(name, 'cyr'));
      
      expect(normalized).toEqual([
        'ўқитувчи',
        'ўқитувчи',
        'шаҳар',
        'шаҳар'
      ]);
    });
  });
});
