import { useStore } from '../../stores/typingStore.js';
import { rowLetterList } from '../keyList.js';

export const useSpacialModel = () => {
  const { gaussianData } = useStore();
  // let gaussianData = {};

  function calcAverage(arr) {
    return arr.reduce((sum, v) => sum + v) / arr.length;
  }

  function calcSigma(arr, ave) {
    return Math.sqrt(
      arr
        .map((v) => (v - ave) ** 2)
        .reduce((sum, v) => {
          return sum + v;
        }) / arr.length
    );
  }

  function calcRelation(letterData, aveX, aveY, sigmaX, sigmaY) {
    return (
      letterData
        .map((v) => (v.position.x - aveX) * (v.position.y - aveY))
        .reduce((sum, v) => sum + v) /
      (letterData.length * sigmaX * sigmaY)
    );
  }

  function calcGaussian(letterData) {
    const posXArr = letterData.map((v) => v.position.x);
    const posYArr = letterData.map((v) => v.position.y);

    const aveX = calcAverage(posXArr);
    const aveY = calcAverage(posYArr);

    const sigmaX = calcSigma(posXArr, aveX);
    const sigmaY = calcSigma(posYArr, aveY);
    // console.log(sigmaX, sigmaY);

    const relation = calcRelation(letterData, aveX, aveY, sigmaX, sigmaY);

    return {
      x: {
        average: aveX,
        sigma: sigmaX,
      },
      y: {
        average: aveY,
        sigma: sigmaY,
      },
      relation: relation,
    };
  }

  function createSpacialModel(tapData) {
    Object.keys(tapData).filter((letter) => {
      gaussianData[letter] = calcGaussian(tapData[letter]);
    });
    console.log(gaussianData);
  }

  function isOutlier(letter, x, y) {
    return (
      Math.abs(gaussianData[letter].x.average - x) >
        3 * gaussianData[letter].x.sigma ||
      Math.abs(gaussianData[letter].y.average - y) >
        3 * gaussianData[letter].y.sigma
    );
  }

  function isSpacialModelCreated() {
    return gaussianData !== {};
  }

  function getSMProbability(x, y) {
    let probabilities = [];
    Object.keys(gaussianData).filter((letter) => {
      let data = gaussianData[letter];
      let [aX, aY] = [data.x.average, data.y.average];
      let [sX, sY] = [data.x.sigma, data.y.sigma];
      let rel = data.relation;

      let z =
        (x - aX) ** 2 / sX ** 2 -
        (2 * rel * (x - aX) * (y - aY)) / (sX * sY) +
        (y - aY) ** 2 / sY ** 2;

      const prob =
        Math.exp(-(z / (2 * (1 - rel ** 2)))) /
        (2 * Math.PI * sX * sY * Math.sqrt(1 - rel ** 2));
      probabilities.push({
        letter: letter,
        probability: !isNaN(prob) ? prob : 0,
      });
    });
    probabilities.sort((a, b) => b.probability - a.probability);
    return probabilities;
  }

  function drawSMCircle() {
    const targetRect = document
      .getElementById('target')
      .getBoundingClientRect();
    const circleContainer = document.getElementById('circle-container');
    Object.keys(gaussianData).filter((letter) => {
      const getH = (letter) => {
        if (rowLetterList[0].indexOf(letter) !== -1)
          return rowLetterList[0].indexOf(letter) * 30;
        if (rowLetterList[1].indexOf(letter) !== -1)
          return 180 + rowLetterList[1].indexOf(letter) * 30;
        if (rowLetterList[2].indexOf(letter) !== -1)
          return rowLetterList[2].indexOf(letter) * 30;
      };
      const width = gaussianData[letter].x.sigma * 3 * 2;
      const height = gaussianData[letter].y.sigma * 3 * 2;

      const left = targetRect.left + gaussianData[letter].x.average;
      const top = targetRect.top + gaussianData[letter].y.average;
      let circle = document.createElement('div');
      circle.setAttribute('class', 'circle');
      circle.style.cssText = `background-color: hsla(${getH(
        letter
      )}, 100%, 80%, 0.1);
      border: solid 1px hsla(${getH(letter)}, 50%, 50%);
      width: ${width}px; height: ${height}px; left: ${left}px; top: ${top}px;`;
      console.log(
        `${letter}: {x: ${gaussianData[letter].x.average}, y: ${gaussianData[letter].y.average}, w: ${width}, h: ${height}},`
      );
      circleContainer.appendChild(circle);
    });
  }
  return {
    createSpacialModel,
    isSpacialModelCreated,
    isOutlier,
    getSMProbability,
    drawSMCircle,
  };
};
