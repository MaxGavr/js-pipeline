"use strict"

const defaultBitCapacity = 8;
const pipelineStages = 16;
var tablePrinted = false;

function BinaryNumber(value = 0, capacity = defaultBitCapacity){
    var number = value;
    var bitCapacity = capacity;

    this.getString = function(){
        var valueString = number.toString(2);
        while (valueString.length < bitCapacity){
            valueString = "0" + valueString;
        }
        return valueString;
    }

    this.getFormattedString = function(){
        var str = this.getString();
        return str.match(/.{1,4}/g).join("-");
    }

    this.getDecimal = function(){
        return number;
    }

    this.toDecimal = function(formattedString){
        var string = formattedString.split("-").join("");
        return parseInt(string, 2);
    }

    this.correctMaxValue = function(){
        return (bitCapacity >= number.toString(2).length);
    }

    this.add = function(secondBinary){
        var result = this.getDecimal() + secondBinary.getDecimal();
        var resultBitCapacity = Math.max(result.toString(2).length, bitCapacity);
        return new BinaryNumber(result, resultBitCapacity);
    }

    this.shift = function(){
        bitCapacity++;
        number = parseInt(this.getString() + "0", 2);
    }
}

function Pipeline(timePerIteration){
    var currentTime = 0;
    var itemsArray = [];

    this.run = function(firstItem){
        while (!this.processingComplete()){
            this.processItems();
        }
    }

    this.push = function(firstBinaryNumber, secondBinaryNumber){
        var newItem = new PipelineItem(firstBinaryNumber, secondBinaryNumber, currentTime);
        itemsArray.push(newItem);
        this.processItems();
    }

    this.getItemsHistory = function(){
        var history = [];
        for (var index = 0; index < itemsArray.length; index++){
            history.push(itemsArray[index].history);
        }
        return history;
    }

    this.processingComplete = function(){
        var complete = true;
        for (var i = 0; i < itemsArray.length; i++){
            if (!itemsArray[i].finished()){
                complete = false;
            }
        }
        return complete;
    }

    this.processItems = function(){
        for (var itemIndex = 0; itemIndex < itemsArray.length; itemIndex++){
            var item = itemsArray[itemIndex];
            if (!item.finished()){
                var stage = item.getStage();
                
                if (stage % 2 == 0){
                    this.shift(item);
                }
                else{
                    this.multiply(item);
                }

                item.writeHistory(currentTime);
                item.setStage(item.getStage() + 1);
            }
        }
        currentTime += timePerIteration;
    }

    this.gatherResult = function(){
        var result = [];
        for (var i = 0; i < itemsArray.length; i++){
            var item = itemsArray[i];
            if (item.finished())
                result.push(item.sum.getDecimal());
        }
        return result;
    }

    this.multiply = function(item){
        var currentBit = item.getCurrentBit();
        if (currentBit == "1")
            item.sum = item.sum.add(item.first);
        else 
            if (currentBit == "0")
                return;
    }

    this.shift = function(item){
        item.sum.shift();
    }
}

function PipelineItem(firstBinaryNumber, secondBinaryNumber, initTime){
    this.first = firstBinaryNumber;
    this.second = secondBinaryNumber;
    this.sum = new BinaryNumber(0, defaultBitCapacity);

    var currentStage = 0;
    var done = false;

    this.history = {
        timeStamps: [initTime],
        sums: [new BinaryNumber(0, defaultBitCapacity).getFormattedString()],
        firstNumber: this.first,
        secondNumber: this.second,
        bit: ["0"]
    };

    this.writeHistory = function(currentTime){
        this.history.timeStamps.push(currentTime);
        this.history.sums.push(this.sum.getFormattedString());
        this.history.bit.push(this.getCurrentBit());
    }

    this.finished = function(){
        return done;
    }

    this.getCurrentBit = function(){
        var bitIndex = Math.floor(this.getStage() / 2);
        return this.second.getString()[bitIndex];
    }

    this.setStage = function(stage){
        currentStage = stage;
        if (stage >= pipelineStages)
            done = true;
    }

    this.getStage = function(){
        return currentStage;
    }
}

function processData(){
    if (tablePrinted){
        removeTable();
        document.getElementById("result").innerHTML = "";
    }
    var data = getInput();
    var pipeline = new Pipeline(data.timePerIteration);
    for (var pair = 0; pair < data.firstArray.length; pair++){
        pipeline.push(data.firstArray[pair], data.secondArray[pair]);
    }
    if (!pipeline.processingComplete()){
        pipeline.run();
    }
    printResultingArray(pipeline.gatherResult());
    printTable(pipeline.getItemsHistory());
    return pipeline.getItemsHistory();
}

function getInput() {
    var inputData = {
        firstArray: getInputNumbers("firstArray"),
        secondArray: getInputNumbers("secondArray"),
        sizeOfTheArray: getArraySize(),
        timePerIteration: getIterationTime()
    };
    return inputData;
}

function getArraySize() {
    var size = document.getElementById("arraySize").value ;
    if (+size < 1 || !Number.isInteger(+size)) 
        throw new inputException("Size of an array should be a positive number!");
    return parseInt(size);
}

function getIterationTime(){
    var time = document.getElementById("time").value;
    if (+time < 1 || !Number.isInteger(+time)) 
        throw new inputException("Time per iteration should be a positive number!");
    return parseInt(time);
}

function getInputNumbers(id){
    var inputString = document.getElementById(id).value;
    var elements = inputString.replace(/\s+/g, '').split(',');
    
    if (elements.length != getArraySize()) 
        throw new inputException("Size incompatibility!");

    var numbers = [];
    var output =[];
    for (var index = 0; index < elements.length; index++){
        var element = elements[index];

        if (element.length < 1 || !Number.isInteger(+element))
            throw new inputException("Input contains incorrect elements!");        
        if (+element < 0)
            throw new inputException("Input contains negative numbers!");

        var number = new BinaryNumber(parseInt(element), defaultBitCapacity);
        if (!number.correctMaxValue()){
            throw new inputException("Input contains too big number!");
        }

        numbers.push(number);
    }
    return numbers;
}

function inputException(message){
    var outputString = '<b>' + message + '</b>';
    document.getElementById('result').innerHTML = outputString;
}

function printResultingArray(result){
    var rawString = result.join(", ");
    var outputString = "<b>C = {" + rawString + "} </b>";
    document.getElementById("result").innerHTML = outputString;
}

function printTable(stateArray){
    if (tablePrinted){
        removeTable();
    }
	var table = document.getElementById('table');
	var currentRow, currentCell;
    var size = getArraySize();

    currentRow = table.insertRow();
    for (var titleColumn = 0; titleColumn < 1 + pipelineStages + 1; titleColumn++){
        currentCell = currentRow.insertCell(titleColumn);
        var output = "";
        if (titleColumn == 0){
            output = "Pair";
        }
        else if (titleColumn == (pipelineStages + 1))
            output = "Output";
        else if ((titleColumn - 1) % 2 == 0)
                output = "Shift";
        else{
            var bit = Math.floor((pipelineStages - titleColumn) / 2);
            output = "Multiplication A*B[" + bit + ']</br>' + "and addition";
        }
        currentCell.innerHTML = "<b>" + output + "</b>";
    }

	for (var row = 0 ; row < size + pipelineStages; row++) {
        currentRow = table.insertRow();
		for (var column = 0; column < 1 + pipelineStages + 1; column++) {
            currentCell = currentRow.insertCell(column);
            for (var pair = 0; pair < size; pair++){
                var A = stateArray[pair].firstNumber;
                var B = stateArray[pair].secondNumber;
                var sum = stateArray[pair].sums[column];
                var time = stateArray[pair].timeStamps[column];
                var bit = stateArray[pair].bit[column];

                // result
                if ((row == pair + pipelineStages) && (column == pipelineStages + 1)) {
                    var result = new BinaryNumber().toDecimal(stateArray[pair].sums[column - 1]);
                    var time = stateArray[pair].timeStamps[column - 1];
                    currentCell.innerHTML = "A: " + A.getFormattedString() + '</br>' +
                                            "B: " + B.getFormattedString() + '</br>' + 
                                            "Result: " + result  + '</br>' + "Time: " + time;;
                }
                // multiplication
                else if ((row == column + pair) && (column % 2 == 0) && column != 0){
                    currentCell.innerHTML = "A: " + A.getFormattedString() + '</br>' +
                                            "B: " + B.getFormattedString() + '</br>' + 
                                            "Bit: " + bit + '</br>' +
                                            "Sum: " + sum + '</br>' + "Time: " + time;
                }
                // shift
                else if ((row == column + pair) && (column % 2 != 0)){
                    currentCell.innerHTML = "A: " + A.getFormattedString() + '</br>' +
                                            "B: " + B.getFormattedString() + '</br>' + 
                                            "Sum: " + sum  + '</br>' + "Time: " + time;
                }
                // initial pairs
                else if ((row == pair + 1) && column == 0) {
                    currentCell.innerHTML = "A: " + A.getDecimal() + '</br>' +
                                            "B: " + B.getDecimal() + '</br>' + 
                                            "Initial sum: " + sum  + '</br>' + "Time: " + time;
                }
            }
        }
    }
    tablePrinted = true;
}

function removeTable(){
    var table = document.getElementById('table');
    table.innerHTML = "";
    tablePrinted = false;
}

function resetInput(){
    document.getElementById('result').innerHTML = '';
    document.getElementById("firstArray").value = "";
    document.getElementById("secondArray").value = "";
    document.getElementById("arraySize").value = "";
    document.getElementById("time").value = "";
}