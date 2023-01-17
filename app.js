const fs = require("fs");
const readStream = fs.createReadStream(__dirname + "/cards.txt", {
  highWaterMark: 512,
});

function multiSplit() {
  function conditionChecker(currentIndex, endIndex) {
    return !(JSON.stringify(currentIndex) === JSON.stringify(endIndex));
  }

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
          `${currentIndex[i] + 1}-${currentIndex[i] + data.length}`,
        ]);

        let writeStream = fs.createWriteStream(
          __dirname +
            `/Phase1/f${i + 1}_${data.length}_${currentIndex[i]}-${
              currentIndex[i] + data.length
            }.json`
        );
        writeStream.write(JSON.stringify(data));
      }

      if (currentIndex[i] + 30 >= endIndex[i]) currentIndex[i] = endIndex[i];
      else currentIndex[i] += block;
    }
  }

  fs.appendFile(__dirname + `/result2.json`, JSON.stringify(result2), (err) => {
    if (err) {
      console.log("49", err);
    }
    console.log(result2);
  });
}

var fileNumber = 1,
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

    // Get slice from data
    if (lastCommaLocation != textToProcess.length - 1) {
      remainFromPreviousFile = "";
      remainFromPreviousFile += textToProcess.slice(lastCommaLocation + 1);
    }

    // Update result1 data
    // add min/max from chunk to result1
    result1.push([allWords[0], allWords[allWords.length - 1], allWords.length]);

    let writeStream = fs.createWriteStream(
      __dirname + `/Phase1/f${fileNumber}_${allWords.length}.json`
    );
    writeStream.write(JSON.stringify(allWords));
    fileNumber += 1;
  })
  .on("end", function () {
    // let writeStream = fs.createWriteStream(__dirname + `/result1.json`);
    // writeStream.write(JSON.stringify(result1));
    fs.writeFile(
      __dirname + `/result1.json`,
      JSON.stringify(result1),
      (err) => {
        console.log(err);
      }
    );

    // Again split file into small chunks of 30
    multiSplit();
  });
