import { describe, expect, it } from 'vitest';
import { analyseCobolTransformation, tokenizeCobolLine } from './cobolTransformation';

// Shape of a real program (MODEL01) and of the Java the converter writes for it.
const COBOL = `      *Author:NAKAGAMI
       IDENTIFICATION  DIVISION.
       PROGRAM-ID.     MODEL01.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01  MODEL-NAME            PIC   X(008)  VALUE 'MODEL01'.
       01  CNT                   PIC   9(009)  VALUE ZERO.
       01  A                     PIC   9(005)  COMP VALUE 5.
       01  TIME-AREA-1.
           03 TIME-01            PIC 9(08)  VALUE ZERO.
           03 FILLER             PIC X(02).
           88 FLAG-ON            VALUE 'Y'.
       PROCEDURE DIVISION.
      * a comment line
       MAIN-CONTROL.
           DISPLAY MODEL-NAME 'STARTED'  UPON CONSOLE.
           PERFORM CASE-0001 THRU C1-EXIT.
           DISPLAY MODEL-NAME 'ENDED'  UPON CONSOLE.
       MAIN-EXIT.
           STOP RUN.
       CASE-0001.
           MOVE   0    TO  CNT.
           PERFORM  UNTIL   CNT > 5
              ADD   1  TO CNT
           END-PERFORM.
       C1-EXIT.
           EXIT.
`;

const JAVA = `public class Model01Model {
	private String modelName;
	private int cnt;
	private Record a;
	private TimeArea_1 timeArea_1;
}
public class Model01Tasklet {
	public void mainControl() {
		case_0001();
	}
	public void case_0001() {
	}
}`;

describe('analyseCobolTransformation', () => {
  const result = analyseCobolTransformation(COBOL, JAVA);

  it('lists data items with their PICTURE, USAGE and the real generated Java field', () => {
    const names = result.dataItems.map((item) => item.cobolName);
    expect(names).toEqual(['MODEL-NAME', 'CNT', 'A', 'TIME-AREA-1', 'TIME-01']);

    const cnt = result.dataItems.find((item) => item.cobolName === 'CNT');
    expect(cnt).toMatchObject({
      level: '01',
      picture: '9(009)',
      value: 'ZERO',
      inferredType: 'int',
      javaDeclaration: 'private int cnt;',
    });
    expect(result.dataItems[0]).toMatchObject({ inferredType: 'String', javaDeclaration: 'private String modelName;' });
    expect(result.dataItems.find((item) => item.cobolName === 'A')).toMatchObject({
      usage: 'COMP',
      inferredType: 'Record / int',
      javaDeclaration: 'private Record a;',
    });
    expect(result.dataItems.find((item) => item.cobolName === 'TIME-AREA-1')?.inferredType).toBe(
      'inner class (group item)',
    );
  });

  it('matches each paragraph to the Java method it became, and leaves the rest unmatched', () => {
    expect(result.paragraphs).toEqual([
      { cobolName: 'MAIN-CONTROL', javaMethod: 'mainControl()' },
      { cobolName: 'MAIN-EXIT', javaMethod: undefined },
      { cobolName: 'CASE-0001', javaMethod: 'case_0001()' },
      { cobolName: 'C1-EXIT', javaMethod: undefined },
    ]);
  });

  it('summarises the statements the program really uses', () => {
    const byName = Object.fromEntries(result.statements.map((s) => [s.cobol, s]));
    expect(byName['DISPLAY ... UPON CONSOLE'].count).toBe(2);
    expect(byName['DISPLAY ... UPON CONSOLE'].java).toBe('Console.println(...)');
    expect(byName['DISPLAY']).toBeUndefined();
    expect(byName['PERFORM paragraph THRU paragraph'].count).toBe(1);
    expect(byName['PERFORM paragraph']).toBeUndefined();
    expect(byName['PERFORM ... UNTIL'].java).toBe('while loop');
    expect(byName['MOVE ... TO'].count).toBe(1);
    expect(byName['STOP RUN / GOBACK'].count).toBe(1);
    expect(byName['EVALUATE']).toBeUndefined();
  });

  it('reports nothing when there is no COBOL source', () => {
    expect(analyseCobolTransformation('', JAVA)).toEqual({ dataItems: [], paragraphs: [], statements: [] });
  });
});

describe('tokenizeCobolLine', () => {
  it('treats a fixed-format comment line as one comment token', () => {
    expect(tokenizeCobolLine('      * ADD')).toEqual([{ kind: 'comment', text: '      * ADD' }]);
  });

  it('marks keywords, strings and numbers', () => {
    const kinds = tokenizeCobolLine("       MOVE 5 TO CNT 'X'").filter((t) => t.text.trim());
    expect(kinds.map((t) => [t.text, t.kind])).toEqual([
      ['MOVE', 'keyword'],
      ['5', 'number'],
      ['TO', 'keyword'],
      ['CNT', 'plain'],
      ["'X'", 'string'],
    ]);
  });
});
