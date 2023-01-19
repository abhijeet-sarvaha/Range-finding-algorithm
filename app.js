const fs = require("fs");
const readStream = fs.createReadStream(__dirname + "/cards.txt", {
  highWaterMark: 512,
});

//////////    PHASE 1    /////////
function splitDataIntoChunks() {
  let fileNumber = 1,
    remainFromPreviousFile = "";

  readStream
    .on("data", function (chunk) {
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
    })
    .on("end", () => {
      console.log("Done reading all raw data");
    });
}

/// Split chunks of data into group of 30 words each  ////
function conditionChecker(currentIndex, endIndex) {
  return !(JSON.stringify(currentIndex) === JSON.stringify(endIndex));
}

function initializeVariables() {
  let currentIndex = [],
    endIndex = [],
    result2 = [];

  let fileNames = fs.readdirSync(__dirname + "/Phase1");
  for (let i = 0; i < fileNames.length; i++) {
    let data = require(__dirname + `/Phase1/${fileNames[i]}`);
    endIndex.push(data.length);
    currentIndex.push(0);
    result2.push([]);
  }

  return { currentIndex, endIndex, result2 };
}

function multiSplit() {
  const block = 30;

  let { currentIndex, endIndex, result2 } = initializeVariables();

  while (conditionChecker(currentIndex, endIndex)) {
    for (let i = 0; i < endIndex.length; i++) {
      let data = require(__dirname +
        `/Phase1/f${i + 1}_${endIndex[i]}.json`).slice(
        currentIndex[i],
        currentIndex[i] + block
      );

      data.sort();
      if (data[0] !== undefined && data.length > 0) {
        result2[i].push([data[0], data[data.length - 1], data.length]);
      }

      if (currentIndex[i] + block >= endIndex[i]) currentIndex[i] = endIndex[i];
      else currentIndex[i] += block;
    }
  }

  return result2;
}

/// Get ranges from group of 30 words ///
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
  let ranges = [],
    group = [],
    findIndexes = [];

  for (let i = 0; i < result2.length; i++) {
    for (let j = 0; j < result2[i].length; j++) {
      result2[i][j].splice(2, 0, i);
    }
    findIndexes.push(0);
  }

  for (let i = 0; i < findIndexes.length; i++) {
    group.push(result2[i][0].slice(0, 3));
    result2[i].splice(0, 1);
    findIndexes[i] += 1;
  }

  while (group.length > 0) {
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
      for (i = 0; i < reset.length - 3; i += 2) {
        ranges.push([reset[i], reset[i + 1]]);
      }
      ranges.push([reset[i], reset[reset.length - 1]]);
    }

    // Insert new block into groups
    let newItemIndex = getNewItem(result2, operate[2]);
    if (newItemIndex != -1) {
      group.push(result2[newItemIndex][0].slice(0, 3));
      result2[newItemIndex].splice(0, 1);
    }
  }

  return ranges;
}

////////////   PHASE 2   //////////////

function splitIntoRanges(ranges) {
  const { endIndex: endIndex } = initializeVariables();

  for (let R = 0; R < ranges.length; R++) {
    for (let f = 0; f < endIndex.length; f++) {
      let wordsInRange = new Set();
      let data = require(__dirname + `/Phase1/f${f + 1}_${endIndex[f]}.json`);
      let i = 0;
      while (i < data.length) {
        if (data[i] >= ranges[R][0] && data[i] <= ranges[R][1])
          wordsInRange.add(data[i]);
        i += 1;
      }
      wordsInRange = [...wordsInRange];

      if (wordsInRange.length > 0) {
        let writeStream = fs.createWriteStream(
          __dirname + `/Phase2/R${R}/f${f}_${wordsInRange.length}.json`
        );
        writeStream.write(JSON.stringify(wordsInRange));
        writeStream.end();
      }
    }
  }
}

//////////// Phase 3 ////////////

function mergeAllFilesInRangeFolders() {
  fs.readdir(__dirname + "/Phase2", (err, folderNames) => {
    if (err) console.log("Error in reading folders from Phase2");
    else {
      folderNames.forEach((folder) => {
        fs.readdir(__dirname + "/Phase2/" + folder, (err, fileNames) => {
          if (err) console.log("Error in reading file from Range");
          else {
            let allRangeWords = [];
            fileNames.forEach((file) => {
              // WORK HERE ONLY
              let W = require(__dirname + `/Phase2/${folder}/` + file);
              allRangeWords = allRangeWords.concat(W);
            });
            allRangeWords = [...new Set(allRangeWords)];
            allRangeWords.sort();

            if (allRangeWords.length > 0) {
              let writeStream = fs.createWriteStream(
                __dirname +
                  "/Phase3" +
                  `/${folder}_${allRangeWords.length}.json`
              );
              writeStream.write(JSON.stringify(allRangeWords));
            }
          }
        });
      });
    }
  });
}

//////////// Phase 4 ////////////

function getResult() {
  const writeStream = fs.createWriteStream(__dirname + "/Phase4/result.json");
  writeStream.write("[null");
  let finalResult = [];
  fs.readdir(__dirname + "/Phase3", (err, fileNames) => {
    fileNames.forEach((file) => {
      let data = require(__dirname + "/Phase3/" + file);
      writeStream.write("," + JSON.stringify(data.toString()));
      finalResult = finalResult.concat(data);
    });
    console.log(finalResult);
    writeStream.write("]");
    writeStream.end();
  });
}

///////// START HERE /////////
// phase 1
// splitDataIntoChunks();
const result2 = multiSplit();
const ranges = getRanges(result2);

// phase 2
splitIntoRanges(ranges);

// phase3
mergeAllFilesInRangeFolders();

// phase 4
getResult();
