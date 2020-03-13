/////////////////////////////////////////////////////////////////////////////////////
// Лабораторная работа 2 по дисциплине ЛОИС
// Выполнена студенткой группы 721702 БГУИР Стрижич Анжелика Олеговна
// Файл содержит функции парсинга строки для проверки синтаксиса и подсчета значений подформул
// 12.03.2020

var checkingMessages = [
    "", // 0
    "invalid symbols", // 1
    "formula must start with '(' and variables for next", // 2
    "formula must end with ')' followed by variables", // 3
    "all groups have to be divided by '&', '|', '~' or '->'", // 4
    "all symbols must be divided by '&', '|', '~' or '->'", // 5
    "all negations have to be braced", // 6
    "all binary operations have to be braced", // 7
    "one braced symbol", // 8
    "extra braces", // 9
    "braces lack", // 10
];

function checkSyntax(formula) {
    if (!formula.match(/^([A-Z()|&!~10]|->)*$/g)) {
        return 1;
    }

    if (!formula.match(/^\((\(*|[01A-Z]|\(!?[01A-Z]\))/) && !formula.match(/[A-Z01]/g)) {
        return 2;
    }

    if (!formula.match(/[A-Z)01]\)$/) && !formula.match(/[A-Z01]/g)) {
        return 3;
    }

    if (formula.match(/\)\(/)) {
        return 4;
    }

    if (formula.match(/[A-Z]([^|&~]|(?!->))[A-Z]/)) {
        return 5;
    }

    if (formula.match(/[^(]![A-B]/) || formula.match(/![A-B][^)]/)) {
        return 6;
    }
    
    if (formula.match(/([|&~]|->)[A-Z]([|&~]|->)/g) || formula.match(/^[A-Z]([|&~]|->)[A-Z]$/g)) {
        return 7;
    }

    if (formula.match(/\([A-Z]\)/)) {
        return 8;
    }

    return 0;
}

function checkPairingBraces(formula) {
    let countOfOpenBraces = formula.split('(').length - 1;
    let countOfCloseBraces = formula.split(')').length - 1;
    
    if (countOfOpenBraces > countOfCloseBraces) {
        return 9;
    }

    if (countOfOpenBraces < countOfCloseBraces) {
        return 10;
    }

    return 0;
}

function checkFormula(formula) {
    if (!formula) {
        return 1;
    }

    let isSyntaxValid = checkSyntax(formula);
    if (isSyntaxValid !== 0) {
        return isSyntaxValid;
    }

    let isBracesPaired = checkPairingBraces(formula);
    if (isBracesPaired !== 0) {
        return isBracesPaired;
    }

    return 0;
}

function build() {
    let formula = document.getElementById('formulaInput').value;

    let syntaxValidationResult = checkFormula(formula);
    if (syntaxValidationResult !== 0) {
        let messageText = document.getElementById('messageText');
        messageText.innerHTML = checkingMessages[syntaxValidationResult];
        messageText.style.color = (syntaxValidationResult == 0 ? '#b9fdc5' : '#eebebe');

        return;
    }

    let resultElement = document.getElementById("result");
    let truthTableElement = document.getElementById("table");

    if (formula.match(/^[A-Z]$/)) {
        resultElement.innerHTML = formula;
    }

    let atoms = getUniqueAtoms(formula);
    let valueSets = getValueSets(atoms);

    truthTableElement.innerHTML = atoms.toString().replace(/,/g, ' | ') + ' = f<br>';
    truthTableElement.innerHTML += '-'.repeat(truthTableElement.innerHTML.length - 4) + '<br>';
    let pdnf = '';

    for (valueSetNumber = 0; valueSetNumber < valueSets.length; valueSetNumber++) {
        let formulaWithValues = formula;
        for (atomIndex = 0; atomIndex < atoms.length; atomIndex++) {
            var rgx = new RegExp(atoms[atomIndex], "g");
            formulaWithValues = formulaWithValues.replace(rgx, valueSets[valueSetNumber][atomIndex]);
        }

        let functionResult = calculateFunctionResult(formulaWithValues);
        truthTableElement.innerHTML += valueSets[valueSetNumber].toString().replace(/,/g, ' | ') + ' = ' + functionResult + '<br>';

        if (functionResult === '1') {
            pdnf += '(';

            for (atomIndex = 0; atomIndex < atoms.length; atomIndex++) {
                if (valueSets[valueSetNumber][atomIndex] === '0') {
                    pdnf += '(!' + atoms[atomIndex] + ')';
                } else {
                    pdnf += atoms[atomIndex];
                }

                if (atomIndex != atoms.length - 1) {
                    pdnf += '&';
                }
            }

            pdnf += ')';
            if (valueSetNumber != valueSets.length - 1) {
                pdnf += '|';
            }
        }
    }

    resultElement.innerHTML = pdnf;
}

function getUniqueAtoms(formula) {
    let atoms = [...new Set(formula.split(/[^A-Z]/).filter(value => value !== ''))];
    return atoms;
}

function getValueSets(atoms) {
    let sets = [];
    for (let row = 0; row < Math.pow(2, atoms.length); row++) {
        sets.push([]);
        let binaryNumber = Array.from(row.toString(2));

        if (binaryNumber.length < atoms.length) {
            sets[row] = Array.from('0'.repeat(atoms.length - binaryNumber.length));
            binaryNumber.forEach(digit => {
                sets[row].push(digit);                
            });
        } else {
            sets[row] = binaryNumber;
        }
    }
    
    return sets;
}

function calculateFunctionResult(formulaWithValues) {
    formulaWithValues = formulaWithValues.replace(/\(!0\)/g, '1');
    formulaWithValues = formulaWithValues.replace(/\(!1\)/g, '0');

    while (formulaWithValues.match(/[|&~]|->/)) {
        formulaWithValues = formulaWithValues.replace(/(\([10]\|1\))|(\(1\|[10]\))/g, '1');
        formulaWithValues = formulaWithValues.replace(/(\(0\|0\))/g, '0');
        
        formulaWithValues = formulaWithValues.replace(/(\([10]\&0\))|(\(0\&[10]\))/g, '0');
        formulaWithValues = formulaWithValues.replace(/(\(1\&1\))/g, '1');

        formulaWithValues = formulaWithValues.replace(/\([10]->1\)/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(1->0\)/g, '0');
        
        formulaWithValues = formulaWithValues.replace(/\(([10])~\1\)/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(([10])~(?!\1)\)/g, '1');
    }

    return formulaWithValues;
}

class TruthTable {
    constructor(atoms, values, functionResults) {
        this.atoms = atoms;
        this.values = values;
        this.functionResults = functionResults;
    }
}