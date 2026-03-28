import { Workbook } from 'exceljs';
import { parseSemesterImportFile } from './semester-import.util';

describe('parseSemesterImportFile', () => {
  it('parses a valid XLSX worksheet with semester-first import columns', async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Import');
    sheet.addRow([
      'semester_code',
      'email',
      'full_name',
      'class_code',
      'student_id',
    ]);
    sheet.addRow([
      'SP26',
      'student1@fpt.edu.vn',
      'Student A',
      'SWP391',
      'SE0001',
    ]);
    sheet.addRow([
      'SP26',
      'student2@fpt.edu.vn',
      'Student B',
      'SWP391',
      'SE0002',
    ]);

    const buffer = await workbook.xlsx.writeBuffer();

    const result = await parseSemesterImportFile(
      Buffer.from(buffer),
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      semester_code: 'SP26',
      email: 'student1@fpt.edu.vn',
      class_code: 'SWP391',
      student_id: 'SE0001',
    });
    expect(result[1]).toMatchObject({
      semester_code: 'SP26',
      email: 'student2@fpt.edu.vn',
      student_id: 'SE0002',
    });
  });

  it('throws when required semester-first columns are missing', async () => {
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Import');
    sheet.addRow(['email', 'class_code']);
    sheet.addRow(['student@fpt.edu.vn', 'SWP391']);

    const buffer = await workbook.xlsx.writeBuffer();

    await expect(
      parseSemesterImportFile(
        Buffer.from(buffer),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ),
    ).rejects.toThrow('Missing required columns');
  });
});
