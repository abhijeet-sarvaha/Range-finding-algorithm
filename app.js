const fs = require("fs");
const readStream = fs.createReadStream(__dirname + "/cards.txt", {
  highWaterMark: 512,
});

//////////    PHASE 1    /////////
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

      data.sort();
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
  // console.log("Result2");
  // console.log(result2);
  for (let i = 0; i < result2.length; i++)
    for (let j = 0; j < result2[i].length; j++) {
      result2[i][j].splice(2, 0, i);
    }

  let ranges = [],
    // group = new Set(),
    group = [],
    findIndexes = [0, 0, 0, 0];

  // Worst time complexity solution

  // for (let i = 0; i < result2.length; i++) {
  //   for (let j = 0; j < result2[i].length; j++) {
  //     for (let k = 0; k < result2[i][j].length - 1; k++) {
  //       group.add(result2[i][j][k]);
  //     }
  //   }
  // }

  // group = [...group];
  // group.sort();
  // if (group.length % 2 == 0) {
  //   for (let i = 0; i < group.length; i += 2) {
  //     ranges.push([group[i], group[i + 1]]);
  //   }
  // } else {
  //   ranges.push([null, group[0]]);
  //   for (let i = 1; i < group.length; i += 2) {
  //     ranges.push([group[i], group[i + 1]]);
  //   }
  // }

  for (let i = 0; i < 4; i++) {
    group.push(result2[i][0].slice(0, 3));
    result2[i].splice(0, 1);
    findIndexes[i] += 1;
  }

  while (group.length > 0) {
    // // console.log("Groups");
    // // console.log(group);
    // group.sort();
    // let operate = group[0],
    //   last = ranges[ranges.length - 1];
    // group.splice(0, 1);
    // ranges.pop();

    // if (last != undefined) {
    //   operate = operate.concat(last);
    //   operate = new Set(operate);
    //   operate = [...operate];
    // }

    // operate.sort();
    // if (operate.length % 2 == 0) {
    //   ranges.push([operate[0], operate[1]]);
    //   if (operate.length == 4) ranges.push([operate[2], operate[3]]);
    // } else {
    //   if (operate.length > 2) {
    //     ranges.push(operate[0], operate[2]);
    //   } else {
    //     ranges[ranges.length - 1][1] = operate[0];
    //   }
    // }

    // Insert new block into groups

    let operate = group[0],
      reset = new Set(),
      ind = ranges.length - 1;
    group.splice(0, 1);
    while (
      ranges[ind] != undefined &&
      (operate[0] <= ranges[ind][0] || operate[0] <= ranges[ind][1])
    ) {
      ranges[ind].forEach((e) => {
        if (e != null) reset.add(e);
      });
      ranges.pop();
      ind -= 1;
    }
    reset.add(operate[0]);
    if (operate[1] != null) reset.add(operate[1]);

    reset = [...reset];
    reset.sort();

    if (reset.length % 2 == 0) {
      for (let i = 0; i < reset.length; i += 2) {
        ranges.push([reset[i], reset[i + 1]]);
      }
    } else {
      let i;
      for (i = 0; i < reset.length - 1; i += 2) {
        ranges.push([reset[i], reset[i + 1]]);
      }
      ranges.push([reset[i], null]);
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

  // console.log("Ranges");
  // console.log(ranges);
  return ranges;
}

////////////   PHASE 2 STARTS   //////////////

function convertToRanges(ranges) {
  // console.log(ranges);
  const endIndex = [59, 63, 57, 4];

  for (let R = 0; R < ranges.length; R++) {
    let wordsInRange = [];
    for (let f = 0; f < endIndex.length; f++) {
      let data = require(__dirname + `/Phase1/f${f + 1}_${endIndex[f]}.json`);
      let i = 0;
      while (
        i < data.length &&
        data[i] >= ranges[R][0] &&
        data[i] <= ranges[R][1]
      ) {
        wordsInRange.push(data[i]);
        i += 1;
      }
    }
    // console.log(wordsInRange);
  }
}

///////// START HERE /////////
// splitDataIntoChunks();
const ranges = getRanges(multiSplit());
convertToRanges(ranges);
