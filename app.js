const fs = require("fs");
const readStream = fs.createReadStream(__dirname + "/cards.txt", {
  highWaterMark: 512,
});

function splitDataIntoChunks() {
  let fileNumber = 1,
    remainFromPreviousFile = "";

  readStream.on("data", function (chunk) {
    let finalVersion = "",
      allWords = [],
      lastCommaLocation = -1,
      textToProcess = remainFromPreviousFile + chunk.toString();

    // Get all words in lowercase
    for (let i = 0; i < textToProcess.length; i++) {
      if (
        textToProcess[i].toLowerCase() != textToProcess[i].toUpperCase() ||
        textToProcess[i] == ","
      ) {
        finalVersion += textToProcess[i].toLowerCase();
      }
    }

    // Get each word and add to array
    textToProcess = finalVersion;
    for (let i = 0; i < textToProcess.length; i++) {
      if (textToProcess[i] == ",") {
        let word = textToProcess.slice(lastCommaLocation + 1, i);
        if (word.length > 0) {
          allWords.push(word);
        }
        lastCommaLocation = i;
      }
    }

    // Sort allWords in an array
    allWords.sort();
    const set = new Set(allWords);
    allWords = [...set];

    // Get slice from data
    if (lastCommaLocation != textToProcess.length - 1) {
      remainFromPreviousFile = "";
      remainFromPreviousFile += textToProcess.slice(lastCommaLocation + 1);
    }

    let writeStream = fs.createWriteStream(
      __dirname + `/Phase1/f${fileNumber}_${allWords.length}.json`
    );
    writeStream.write(JSON.stringify(allWords));
    fileNumber += 1;
  });
}

///////// Split chunks of data into group of 30 words each  /////////
function conditionChecker(currentIndex, endIndex) {
  return !(JSON.stringify(currentIndex) === JSON.stringify(endIndex));
}

function multiSplit() {
  var currentIndex = [0, 0, 0, 0];

  const block = 30,
    endIndex = [59, 63, 57, 4],
    result2 = [[], [], [], []];

  while (conditionChecker(currentIndex, endIndex)) {
    for (let i = 0; i < 4; i++) {
      let data = require(__dirname +
        `/Phase1/f${i + 1}_${endIndex[i]}.json`).slice(
        currentIndex[i],
        currentIndex[i] + block
      );

      if (data[0] !== undefined && data.length > 0) {
        result2[i].push([data[0], data[data.length - 1], data.length]);
      }

      if (currentIndex[i] + 30 >= endIndex[i]) currentIndex[i] = endIndex[i];
      else currentIndex[i] += block;
    }
  }

  // console.log(result2);
  return result2;
}

///////// Get ranges from group of 30 words ////////////
function getNewItem(result2, index) {
  while (
    result2[index] != undefined &&
    result2[index].length == 0 &&
    index < result2.length
  ) {
    index += 1;
  }
  if (index < result2.length) return index;
  return -1;
}

function getRanges(result2) {
  console.log("Result2");
  console.log(result2);
  for (let i = 0; i < result2.length; i++)
    for (let j = 0; j < result2[i].length; j++) {
      result2[i][j].splice(2, 0, i);
    }

  let ranges = [],
    group = [],
    findIndexes = [0, 0, 0, 0];

  function insertIntoRanges(newGroups) {
    newGroups.forEach((grp) => {
      grp.sort();
    });
  }

  function getRanges() {
    // console.log();
  }
  for (let i = 0; i < 4; i++) {
    group.push(result2[i][0].slice(0, 3));
    result2[i].splice(0, 1);
    findIndexes[i] += 1;
  }

  while (group.length > 0) {
    // console.log("Groups");
    // console.log(group);
    group.sort();
    let operate = group[0];
    group.splice(0, 1);
    // console.log(operate);
    try {
      let result = operate[0].localeCompare(ranges[ranges.length - 1][2]);
      if (result == -1) {
        let last = ranges[ranges.length - 1],
          newGroups = [[last[0], operate[0]]];

        if (last[1].localeCompare(operate[1]) == -1)
          newGroups.push([last[1], operate[1]]);
        else newGroups.push([operate[1], last[1]]);

        ranges.pop();
        insertIntoRanges(newGroups);
      } else throw "error";
    } catch (error) {
      ranges.push(operate.slice(0, 2));
    }
    let newItemIndex = getNewItem(result2, operate[2]);
    if (newItemIndex != -1) {
      group.push(result2[newItemIndex][0].slice(0, 3));
      result2[newItemIndex].splice(0, 1);
    }

    // console.log(group);
    // console.log(ranges);
    // console.log("============");
  }
  console.log("Ranges");
  console.log(ranges);
}

///////// START HERE /////////
splitDataIntoChunks();
getRanges(multiSplit());
