/////////////////////////////////////////////////////////////////////////////////////
// Лабораторная работа 1 по дисциплине ЛОИС
// Выполнена студенткой группы 721702 БГУИР Стрижич Анжелика Олеговна
// Файл содержит функции парсинга строки для проверки формулы СКНФ и функции обработки тестовых заданий
// 25.02.2020

var checkingMessages = [ 
    "this function is in principal conjuctive normal form", // 0
    "invalid symbols", // 1
    "formula has groups divided by '|', '->' or '~'", // 2
    "not all of subgroups have equal count of variables", // 3
    "formula contains equal elementary disjunctions", // 4
    "invalid syntax: formula must end with ')' followed by variables", // 5
    "invalid syntax: all symbols must be divided by '&', '|', '~' or '->'", // 6
    "invalid syntax: formula must start with '(' and variables for next", // 7
    "some groups have extra (different from other groups sets) variables", // 8
    "invalid syntax: braces missing", // 9
    "invalid syntax: all negations have to be braced", // 10
    "enter formula", // 11
    "invalid syntax: formula contains complex negations", // 12
    "formula has unmatched operators", // 13
    "invalid syntax: all groups have to be divided by '&', '|', '~' or '->'", // 14
    "expected disjunctions contain '&', '~' or '->'", // 15
    "formula consists of single braced symbol (tip: debrace it) or single non-disjunction expression", // 16
    "invalid syntax: extra braces", // 17
    "invalid syntax: all binary operations have to be braced", // 18
    "this function is not in principal conjuctive normal form", // 19
    "invalid syntax: double negation found", // 20
];

function checkSyntax(formula) {
    if (!formula.match(/^([A-Z()|&!~10]|->)*$/g)) {
        return 1;
    }

    if (!formula.match(/^\((\(*|[01A-Z]|\(!?[01A-Z]\))/) && !formula.match(/[A-Z01]/g)) {
        return 7;
    }

    if (!formula.match(/[A-Z)01]\)$/) && !formula.match(/[A-Z01]/g)) {
        return 5;
    }

    if (formula.match(/[01]/g)) {
        return 19;
    }
    
    if (formula.match(/!\(/)) {
        return 12;
    }

    if (formula.match(/\)\(/)) {
        return 14;
    }

    if (formula.match(/[A-Z]([^|&~]|(?!->))[A-Z]/)) {
        return 6;
    }

    if (formula.match(/[^(]![A-B]/) || formula.match(/![A-B][^)]/)) {
        return 10;
    }

    if (formula.match(/^\(([A-Z])(([&~]|->)(?!!\1)!?[A-Z])?\)$/)) {
        return 16;
    }
    
    if (formula.match(/([|&~]|->)[A-Z]([|&~]|->)/g) || formula.match(/^[A-Z]([|&~]|->)[A-Z]$/g)) {
        return 18;
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
        return 17;
    }

    return 0;
}

function debrace(formula) {
    // ((x|y) | z) = (x|y) | z
    formula = formula.replace(/\((.*)\)/, '\$1');
    // (!x) = !x
    formula = formula.replace(/\((![A-Z])\)/g, '\$1');

    return formula;
}

function checkLiteralSets(groups) {
    let literalGroups = [];

    groups.forEach(value => {
        let literals = value.split('|').filter(value => value && value !== "|");
        literalGroups.push(literals);
    });

    for (i = 0; i < literalGroups.length - 1; i++) {
        if (literalGroups[i][0].match(/[&~]|->/)) {
            return 15;
        }

        for (j = i + 1; j < literalGroups.length; j++) {
            if (literalGroups[i].length !== literalGroups[j].length) {
                return 3;
            }
            
            if (compareArrays(literalGroups[i], literalGroups[j])) {
                return 4;
            }

            let iLiteralsCopy = [];
            let jLiteralsCopy = [];

            literalGroups[i].forEach(value => iLiteralsCopy.push(value.replace('!', '')));
            literalGroups[j].forEach(value => jLiteralsCopy.push(value.replace('!', '')));

            if (!compareArrays(iLiteralsCopy, jLiteralsCopy)) {
                return 8;
            }
        }
    }

    return 0;
}

function checkFormula(formula) {
    if (!formula) {
        return 11;
    }

    // starting syntax check
    let isSyntaxValid = checkSyntax(formula);
    if (isSyntaxValid !== 0) {
        return isSyntaxValid;
    }

    formula = debrace(formula);

    // braces pairing check
    let isBracesPaired = checkPairingBraces(formula);
    if (isBracesPaired !== 0) {
        return isBracesPaired;
    }

    // parsing exactly
    let dirtyGroups = formula.split(/\)([&|~]|->)\(/g);

    let groups = [];
    dirtyGroups.forEach(group => {
        groups.push(group.replace(/[()]/g, ''));
    });

    if (groups.indexOf('|') !== -1 || groups.indexOf('->') !== -1 || groups.indexOf('~') !== -1) {
        return 2;
    }

    groups = groups.filter(group => group !== '&');

    let isLiteralsUnique = checkLiteralSets(groups);
    if (isLiteralsUnique !== 0) {
        return isLiteralsUnique;
    }

    return 0;
}

function build() {
    let formula = document.getElementById('formulaInput').value;
    let atoms = getUniqueAtoms(formula);
    let valueSets = getValueSets(atoms);

    for (valueSetNumber = 0; valueSetNumber < valueSets.length; valueSetNumber++) {
        let formulaWithValues = formula;
        for (atomIndex = 0; atomIndex < atoms.length; atomIndex++) {
            var rgx = new RegExp(atoms[atomIndex], "g");
            formulaWithValues = formulaWithValues.replace(rgx, valueSets[valueSetNumber][atomIndex]);
        }
        console.log(formulaWithValues);
    }
}

function compareArrays(array1, array2) {
    var i = array1.length;

    while (i--) {
        if (array1[i] !== array2[i]) {
            return false;
        }
    }

    return true;
}

//////////

function getUniqueAtoms(formula) {
    let atoms = [...new Set(formula.split(/[^A-Z]/).filter(value => value !== ''))];
    return atoms;
}

function and(x, y) {
    return x && y;
}

function or(x, y) {
    return x || y;
}

function not(x) {
    return !x;
}

function implication(x, y) {
    return !x || y;
}

function equivalence(x, y) {
    return x === y;
}

function getValueSets(atoms) {
    console.log(atoms);

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

}

class TruthTable {
    constructor(atoms, values, functionResults) {
        this.atoms = atoms;
        this.values = values;
        this.functionResults = functionResults;
    }
}