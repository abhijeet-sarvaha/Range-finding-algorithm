const fs = require("fs");
const readStream = fs.createReadStream(__dirname + "/cards.txt", {
  highWaterMark: 512,
});

function splitDataIntoChunks() {
  let fileNumber = 1,
    remainFromPreviousFile = "",
    result1 = [];

  readStream
    .on("data", function (chunk) {
      let writeToFile = "",
        finalVersion = "",
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

      // Update result1 data
      // add min/max from chunk to result1
      result1.push([
        allWords[0],
        allWords[allWords.length - 1],
        allWords.length,
      ]);

      let writeStream = fs.createWriteStream(
        __dirname + `/Phase1/f${fileNumber}_${allWords.length}.json`
      );
      writeStream.write(JSON.stringify(allWords));
      fileNumber += 1;
    })
    .on("end", function () {
      fs.appendFileSync(
        __dirname + `/result1.json`,
        JSON.stringify(result1),
        (err) => {
          console.log(err);
        }
      );
    });
}

///////// Split chunks of data into group of 30 words each  /////////
function conditionChecker(currentIndex, endIndex) {
  return !(JSON.stringify(currentIndex) === JSON.stringify(endIndex));
}

function multiSplit() {
  var currentIndex = [0, 0, 0, 0];

  const block = 30,
    endIndex = [72, 77, 77, 4],
    result2 = [[], [], [], []];

  while (conditionChecker(currentIndex, endIndex)) {
    for (let i = 0; i < 4; i++) {
      let data = require(__dirname +
        `/Phase1/f${i + 1}_${endIndex[i]}.json`).slice(
        currentIndex[i],
        currentIndex[i] + block
      );

      if (data[0] !== undefined && data.length > 0) {
        result2[i].push([
          data[0],
          data[data.length - 1],
          `f${i + 1}_${data.length}`,
        ]);

        // let writeStream = fs.createWriteStream(
        //   __dirname +
        //     `/Phase1/f${i + 1}_${data.length}_${currentIndex[i]}-${
        //       currentIndex[i] + data.length
        //     }.json`
        // );
        // writeStream.write(JSON.stringify(data));
      }

      if (currentIndex[i] + 30 >= endIndex[i]) currentIndex[i] = endIndex[i];
      else currentIndex[i] += block;
    }
  }

  // fs.appendFileSync(
  //   __dirname + `/result1.json`,
  //   JSON.stringify(result2),
  //   (err) => {
  //     if (err) {
  //       console.log("49", err);
  //     }
  //     // console.log(result2);
  //   }
  // );

  return result2;
}

///////// Get ranges from group of 30 words ////////////
function getRanges(result2) {
  let ranges = [];
  let group = [],
    findIndexes = [0, 0, 0, 0];

  for (let i = 0; i < 4; i++) {
    group.push(result2[i][0].slice(0, 2));
    findIndexes[i] += 1;
  }

  console.log(group);
  while (group.length > 0) {
    group.sort();
    let operate = group[0];
    group.splice(0, 1);

    try {
      let result = operate[0].localeCompare(ranges[ranges.length - 1][2]);
      if (result == -1) {
        let last = ranges[ranges.length - 1];
        ranges.pop();
        let newGroups = [
          [operate[0], last[0]],
          [operate[1], last[1]],
        ];
        // console.log(newGroups);
        newGroups.forEach((grp) => {
          ranges.push(grp);
        });
      } else throw "error";
    } catch (error) {
      // console.log("Error called");
      ranges.push(operate.slice(0, 2));
    }

    // console.log(group);
    // console.log(ranges);
    // console.log("============");
  }
  console.log(ranges);
}

///////// START HERE /////////

// splitDataIntoChunks();
let R2 = multiSplit();
getRanges(R2);
