/////////////////////////////////////////////////////////////////////////////////////
// Лабораторная работа 2 по дисциплине ЛОИС
// Выполнена студенткой группы 721702 БГУИР Стрижич Анжелика Олеговна
// Файл содержит функции парсинга строки для проверки синтаксиса и подсчета значений подформул
// 5.04.2020

function checkSymbols(formula) {
    return formula.match(/^([A-Z()|&!~10]|->)*$/g);
}

function checkSyntax(formula) {
    return formula.match(/^[A-Z01]$/) ||
        (!formula.match(/\)\(/) &&
        !formula.match(/[A-Z01]([^|&~]|(?!->))[A-Z01]/) &&
        !formula.match(/[^(]![A-Z01]/) && !formula.match(/![A-Z01][^)]/) &&
        !formula.match(/\([A-Z01]\)/) &&
        checkPairingBraces(formula) &&
        checkBinaryOperationsBracing(formula));
}

function checkBinaryOperationsBracing(formula) {
    let formulaCopy = formula;

    while (formulaCopy.match(/([|&~]|->)/g) || !formulaCopy.match(/^[A()]+$/g)) {
        let prevCopy = formulaCopy;

        formulaCopy = formulaCopy.replace(/\(![A-Z01]\)/g, 'A');
        formulaCopy = formulaCopy.replace(/\([A-Z01]([|&~]|->)[A-Z01]\)/g, 'A');

        if (formulaCopy === prevCopy) {
            return false;
        }
    }

    return formulaCopy === 'A';
}

function checkPairingBraces(formula) {
    let open = formula.split('(').length - 1;
    let closed = formula.split(')').length - 1;
    
    return open == closed;
}

function checkFormula(formula) {
    return checkSymbols(formula) && checkSyntax(formula);
}

function build() {
    let formula = document.getElementById('formulaInput').value;
    let truthTableElement = document.getElementById("table");
    let resultElement = document.getElementById("result");

    let syntaxValidationResult = checkFormula(formula);
    if (!syntaxValidationResult) {
        let messageText = document.getElementById('messageText');
        messageText.innerHTML = "it isn't a formula";
        messageText.style.color = '#eebebe';

        truthTableElement.innerHTML = '';
        resultElement.innerHTML = '';

        return;
    }
    else {
        messageText.innerHTML = '';
    }


    let atoms = getUniqueAtoms(formula);
    let valueSets = getValueSets(atoms);

    truthTableElement.innerHTML = atoms.toString().replace(/,/g, ' | ') + ' | f<br>';
    truthTableElement.innerHTML += '-'.repeat(truthTableElement.innerHTML.length - 4) + '<br>';

    var positiveResultValueSets = getPositiveResultValueSets(valueSets, formula, atoms, truthTableElement);
    
    let pdnf = '';    
    let countOfGroups = 0;

    for (valueSetNumber = 0; valueSetNumber < positiveResultValueSets.length; valueSetNumber++) {
        pdnf += (countOfGroups == 1 || valueSetNumber == 0) ? '' : '|';

        if (valueSetNumber < positiveResultValueSets.length - 1) {
            pdnf += '(';
        }

        pdnf += (atoms.length == 1) ? '' : '(';

        // fiil group with variables, dividing them with '&('
        pdnf += createGroup(atoms, valueSets, positiveResultValueSets, valueSetNumber);
    }

    for (valueSetNumber = 0; valueSetNumber < positiveResultValueSets.length - 1; valueSetNumber++) {
        pdnf += ')';
    }

    resultElement.innerHTML = pdnf;
}

function createGroup(atoms, valueSets, positiveResultValueSets, valueSetNumber) {
    let group = '';

    for (atomIndex = 0; atomIndex < atoms.length; atomIndex++) {
        if (valueSets[positiveResultValueSets[valueSetNumber]][atomIndex] === '0') {
            group += '(!' + atoms[atomIndex] + ')';
        } else {
            group += atoms[atomIndex];
        }

        if (atomIndex != atoms.length - 1) {
            group += '&';
        }
        if (atomIndex < atoms.length - 2) {
            group += '(';
        }
    }

    // adding closing braces
    for (atomIndex = 0; atomIndex < atoms.length - 1; atomIndex++) {
        group += ')';
    }

    return group;
}

function getPositiveResultValueSets(valueSets, formula, atoms, truthTableElement) {
    let positiveResultValueSets = [];

    for (valueSetNumber = 0; valueSetNumber < valueSets.length; valueSetNumber++) {
        let formulaWithValues = formula;
        for (atomIndex = 0; atomIndex < atoms.length; atomIndex++) {
            var rgx = new RegExp(atoms[atomIndex], "g");
            formulaWithValues = formulaWithValues.replace(rgx, valueSets[valueSetNumber][atomIndex]);
        }

        let functionResult = calculateFunctionResult(formulaWithValues);
        if (functionResult == 1) {
            positiveResultValueSets.push(valueSetNumber);
        }

        truthTableElement.innerHTML += valueSets[valueSetNumber].toString().replace(/,/g, ' | ') + ' | ' + functionResult + '<br>';
    }

    return positiveResultValueSets;
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
    while (formulaWithValues.match(/[!|&~]|->/)) {
        formulaWithValues = formulaWithValues.replace(/\(?!0\)?/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(?!1\)?/g, '0');

        formulaWithValues = formulaWithValues.replace(/(\([10]\|1\))|(\(1\|[10]\))/g, '1');
        formulaWithValues = formulaWithValues.replace(/(\(0\|0\))/g, '0');
        
        formulaWithValues = formulaWithValues.replace(/(\([10]\&0\))|(\(0\&[10]\))/g, '0');
        formulaWithValues = formulaWithValues.replace(/(\(1\&1\))/g, '1');

        formulaWithValues = formulaWithValues.replace(/\(1->0\)/g, '0');
        formulaWithValues = formulaWithValues.replace(/\([10]->[10]\)/g, '1');
        
        formulaWithValues = formulaWithValues.replace(/\(0~0\)|\(1~1\)/g, '1');
        formulaWithValues = formulaWithValues.replace(/\(([10])~[10]\)/g, '0');
    }

    return formulaWithValues;
}

///////////// quest.js

class Question {
    constructor(formula, answer) {
        this.formula = formula;
        this.answer = answer;
    }
}

var variablesCodes = [ 'I', 'J', 'K' ];

var currentQuestion = generateQuestion();
var countOfQuestions = 10;
var currentQuestionIndex = 1;
var correctAnswers = 0;

renderQuestion();

var nextButton = document.getElementById('nextButton');
var questSection = document.getElementById('questSection');
var resultSection = document.getElementById('resultSection');

function next() {
    let currentAnswerElement = document.getElementById(currentQuestion.answer.toString());

    if (currentAnswerElement.checked) {
        correctAnswers++;
    }

    ++currentQuestionIndex;
    if (currentQuestionIndex === countOfQuestions) {
        document.getElementById('score').innerHTML = 10 * correctAnswers / countOfQuestions;

        questSection.style.display = 'none';
        resultSection.style.display = 'flex';
        document.
        return;
    }

    currentQuestion = generateQuestion();

    renderQuestion();
}

function generateQuestion() {
    let countOfArgs = getRandomInt(2);
    let countOfGroups = getRandomInt(Math.pow(2, countOfArgs));

    let formula = generateFormula(countOfGroups, countOfArgs);
    let answer = checkFormula(formula) === 0 ? true : false;

    return new Question(formula, answer);
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max)) + 1;
}

function generateFormula(countOfGroups, countOfArgs) {
    let formula = '';

    for (i = 0; i < countOfGroups; i++) {
        let countOfArgsInParticualarGroup = countOfArgs - getRandomInt(countOfArgs) + 2;
        let group = '';

        if (countOfGroups !== 1 && i < countOfGroups - 1) {
            formula += '(';
        }

        for (j = 0; j < countOfArgsInParticualarGroup; j++) {
            if (countOfArgsInParticualarGroup !== 1 && j < countOfArgsInParticualarGroup - 1) {
                group += '(';
            }

            let isNegative = (Math.random() >= 0.5);
            group += (isNegative ? '(!' : '') + variablesCodes[j] + (isNegative ? ')' : '');
            if (j < countOfArgsInParticualarGroup - 1) {
                let random  = Math.random();
                group += ((random >= 0.2) ? '|' : (random >= 0.1 ? '&' : (random >= 0.05 ? '~' : '->')));
            }
        }

        for (j = 0; j < countOfArgsInParticualarGroup - 1; j++) {
            if (countOfArgsInParticualarGroup !== 1) {
                group += ')';
            }
        }

        formula += group;

        if (i < countOfGroups - 1) {
            let random  = Math.random();
            formula += ((random >= 0.3) ? '|' : (random >= 0.2 ? '&' : (random >= 0.1 ? '~' : '->')));
        }
    }

    for (j = 0; j < countOfGroups - 1; j++) {
        if (countOfGroups !== 1) {
            formula += ')';
        }
    }

    return formula;
}

function renderQuestion() {
    document.getElementById('formula').innerHTML = currentQuestion.formula;
}