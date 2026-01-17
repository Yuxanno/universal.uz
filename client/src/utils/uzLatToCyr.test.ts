/**
 * Unit-тесты для конвертера узбекского латинского алфавита в кириллицу
 */

import { uzLatToCyr } from './uzLatToCyr';

describe('uzLatToCyr', () => {
  describe('Базовые слова', () => {
    test('o\'qituvchi -> ўқитувчи', () => {
      expect(uzLatToCyr("o'qituvchi")).toBe('ўқитувчи');
    });

    test('g\'isht -> ғишт', () => {
      expect(uzLatToCyr("g'isht")).toBe('ғишт');
    });

    test('shahar -> шаҳар', () => {
      expect(uzLatToCyr('shahar')).toBe('шаҳар');
    });

    test('chaqaloq -> чақалоқ', () => {
      expect(uzLatToCyr('chaqaloq')).toBe('чақалоқ');
    });

    test('yo\'l -> йўл', () => {
      expect(uzLatToCyr("yo'l")).toBe('йўл');
    });
  });

  describe('Специальные комбинации', () => {
    test('yangi -> янги', () => {
      expect(uzLatToCyr('yangi')).toBe('янги');
    });

    test('yurt -> юрт', () => {
      expect(uzLatToCyr('yurt')).toBe('юрт');
    });

    test('yengil -> енгил', () => {
      expect(uzLatToCyr('yengil')).toBe('енгил');
    });

    test('yoqimli -> ёқимли', () => {
      expect(uzLatToCyr('yoqimli')).toBe('ёқимли');
    });

    test('tong -> тонг', () => {
      expect(uzLatToCyr('tong')).toBe('тонг');
    });
  });

  describe('Слова с апострофами', () => {
    test('o\'zbekiston -> ўзбекистон', () => {
      expect(uzLatToCyr("o'zbekiston")).toBe('ўзбекистон');
    });

    test('g\'alaba -> ғалаба', () => {
      expect(uzLatToCyr("g'alaba")).toBe('ғалаба');
    });

    test('bo\'lim -> бўлим', () => {
      expect(uzLatToCyr("bo'lim")).toBe('бўлим');
    });

    test('qo\'shish -> қўшиш', () => {
      expect(uzLatToCyr("qo'shish")).toBe('қўшиш');
    });
  });

  describe('Заглавные буквы', () => {
    test('Shahar -> Шаҳар', () => {
      expect(uzLatToCyr('Shahar')).toBe('Шаҳар');
    });

    test('Chiroyli -> Чиройли', () => {
      expect(uzLatToCyr('Chiroyli')).toBe('Чиройли');
    });

    test('O\'zbekiston -> Ўзбекистон', () => {
      expect(uzLatToCyr("O'zbekiston")).toBe('Ўзбекистон');
    });

    test('G\'alaba -> Ғалаба', () => {
      expect(uzLatToCyr("G'alaba")).toBe('Ғалаба');
    });
  });

  describe('Сложные слова', () => {
    test('choyxona -> чойхона', () => {
      expect(uzLatToCyr('choyxona')).toBe('чойхона');
    });

    test('qo\'ng\'iroq -> қўнғироқ', () => {
      expect(uzLatToCyr("qo'ng'iroq")).toBe('қўнғироқ');
    });

    test('sho\'rva -> шўрва', () => {
      expect(uzLatToCyr("sho'rva")).toBe('шўрва');
    });

    test('yoshlik -> ёшлик', () => {
      expect(uzLatToCyr('yoshlik')).toBe('ёшлик');
    });
  });

  describe('Пустые и специальные случаи', () => {
    test('Пустая строка', () => {
      expect(uzLatToCyr('')).toBe('');
    });

    test('Строка с цифрами: tovar123 -> товар123', () => {
      expect(uzLatToCyr('tovar123')).toBe('товар123');
    });

    test('Строка с пробелами: yangi yil -> янги йил', () => {
      expect(uzLatToCyr('yangi yil')).toBe('янги йил');
    });

    test('Строка с дефисом: o\'zbekiston-respublikasi', () => {
      expect(uzLatToCyr("o'zbekiston-respublikasi")).toBe('ўзбекистон-республикаси');
    });
  });

  describe('Альтернативные апострофы', () => {
    test('Unicode апостроф ʻ: oʻqituvchi -> ўқитувчи', () => {
      expect(uzLatToCyr('oʻqituvchi')).toBe('ўқитувчи');
    });

    test('Правый апостроф: ozbekiston -> uzbekiston', () => {
      const input = "o'zbekiston";
      expect(uzLatToCyr(input)).toBe('ўзбекистон');
    });
  });
});
