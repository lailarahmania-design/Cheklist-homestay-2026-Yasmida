import { describe, it, expect } from 'vitest';
import { addQuestion, updateQuestion, deleteQuestion, moveQuestion, mergeBank, replaceBank, bankTemplate, countQuestions } from '../../src/question-bank/bank-ops.js';
import { emptyBank, validateBank } from '../../src/question-bank/schema.js';

const bq = (id) => ({ id, question: id, options: ['a', 'b'], answer: 0, score: null });

describe('operasi bank soal', () => {
  it('tambah, ubah, urutkan, hapus tanpa mengubah objek asli', () => {
    const b0 = emptyBank();
    let b = addQuestion(b0, 'pos2', bq('x'));
    b = addQuestion(b, 'pos2', bq('y'));
    expect(b0.pos[1].questions.length).toBe(0);
    b = updateQuestion(b, 'pos2', { ...bq('x'), question: 'baru' });
    expect(b.pos[1].questions[0].question).toBe('baru');
    b = moveQuestion(b, 'pos2', 'y', -1);
    expect(b.pos[1].questions.map((q) => q.id)).toEqual(['y', 'x']);
    b = moveQuestion(b, 'pos2', 'y', -1); // sudah paling atas
    expect(b.pos[1].questions.map((q) => q.id)).toEqual(['y', 'x']);
    b = deleteQuestion(b, 'pos2', 'y');
    expect(countQuestions(b)).toEqual({ pos1: 0, pos2: 1, pos3: 0 });
  });

  it('gabung: ID yang bentrok diganti, soal lama tetap', () => {
    const cur = addQuestion(emptyBank(), 'pos2', bq('contoh_pos2_1'));
    const inc = validateBank(bankTemplate()).bank;
    const { bank, added, renamed } = mergeBank(cur, inc);
    expect(added).toBe(4);
    expect(renamed).toBe(1);
    expect(bank.pos[1].questions.length).toBe(2);
    expect(new Set(bank.pos.flatMap((p) => p.questions.map((q) => q.id))).size).toBe(5);
  });

  it('ganti: bank lama dibuang', () => {
    const cur = addQuestion(emptyBank(), 'pos2', bq('lama'));
    const b = replaceBank(cur, validateBank(bankTemplate()).bank);
    expect(b.pos[1].questions.map((q) => q.id)).toEqual(['contoh_pos2_1']);
  });
});
