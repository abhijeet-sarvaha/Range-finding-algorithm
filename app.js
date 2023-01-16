const fs = require("fs");
const readStream = fs.createReadStream(__dirname + "/cards.txt", {
  highWaterMark: 1024,
});

var fileNumber = 1,
  remainFromPreviousFile = "",
  result = {};

readStream
  .on("data", function (chunk) {
    let writeStream = fs.createWriteStream(__dirname + `/f${fileNumber}.txt`);

    let writeToFile = "",
      finalVersion = "",
      allWords = [],
      lastCommaLocation = -1,
      textToProcess = remainFromPreviousFile + chunk.toString();

    for (let i = 0; i < textToProcess.length; i++) {
      if (
        textToProcess[i].toLowerCase() != textToProcess[i].toUpperCase() ||
        textToProcess[i] == ","
      ) {
        finalVersion += textToProcess[i].toLowerCase();
      }
    }

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

    allWords.sort();
    for (let i = 0; i < allWords.length; i++) {
      writeToFile += allWords[i] + ",";
    }

    if (lastCommaLocation != textToProcess.length - 1) {
      remainFromPreviousFile = "";
      remainFromPreviousFile += textToProcess.slice(lastCommaLocation + 1);
    }

    result[`F${fileNumber}`] = {
      minimum: allWords[0],
      maximum: allWords[allWords.length - 1],
    };

    // console.log(allWords[0]);
    writeStream.write(writeToFile);
    fileNumber += 1;

    // console.log(result);
  })
  .on("end", function () {
    console.log(result);
  });
